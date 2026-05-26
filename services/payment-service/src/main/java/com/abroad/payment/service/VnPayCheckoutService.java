package com.abroad.payment.service;

import com.abroad.payment.client.CourseEnrollmentClient;
import com.abroad.payment.config.VnpayProperties;
import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.repository.PaymentRepository;
import com.abroad.payment.vnpay.VnPayCrypto;
import com.abroad.payment.web.dto.VnpayCreateRequest;
import com.abroad.payment.web.dto.VnpayCreateResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VnPayCheckoutService {

    private static final String VERSION = "2.1.0";
    private static final String COMMAND = "pay";
    private static final String ORDER_TYPE = "other";
    private static final DateTimeFormatter CREATE_FMT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final VnpayProperties vnpay;
    private final PaymentRepository paymentRepository;
    private final BillingSubscriptionService billingSubscriptionService;
    private final CourseEnrollmentClient courseEnrollmentClient;

    public VnPayCheckoutService(
            VnpayProperties vnpay,
            PaymentRepository paymentRepository,
            BillingSubscriptionService billingSubscriptionService,
            CourseEnrollmentClient courseEnrollmentClient) {
        this.vnpay = vnpay;
        this.paymentRepository = paymentRepository;
        this.billingSubscriptionService = billingSubscriptionService;
        this.courseEnrollmentClient = courseEnrollmentClient;
    }

    public boolean isReady() {
        return vnpay.isConfigured();
    }

    @Transactional
    public VnpayCreateResponse createPaymentUrl(String userId, VnpayCreateRequest req, String clientIp)
            throws Exception {
        if (!isReady()) {
            throw new IllegalStateException("Chưa cấu hình VNPAY_TMN_CODE / VNPAY_HASH_SECRET / VNPAY_RETURN_URL");
        }
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "127.0.0.1";
        }
        if (clientIp.contains(",")) {
            clientIp = clientIp.split(",")[0].trim();
        }

        BigDecimal amountVnd =
                req.amountVnd().setScale(0, RoundingMode.HALF_UP);
        if (amountVnd.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("Số tiền không hợp lệ");
        }
        if (req.courseId() == null) {
            if (req.planCode() == null || req.planCode().isBlank()) {
                throw new IllegalArgumentException("planCode là bắt buộc cho thanh toán gói");
            }
            if (req.billingCycle() == null || req.billingCycle().isBlank()) {
                throw new IllegalArgumentException("billingCycle là bắt buộc cho thanh toán gói");
            }
        }
        long amountMinor = amountVnd.multiply(BigDecimal.valueOf(100)).longValueExact();

        Instant now = Instant.now();
        Payment p = new Payment();
        UUID id = UUID.randomUUID();
        p.setId(id);
        p.setUserId(userId);
        p.setCourseId(req.courseId());
        p.setAmount(amountVnd);
        p.setCurrency("VND");
        p.setDescription(req.orderInfo());
        p.setPlanCode(req.planCode());
        p.setBillingCycle(req.billingCycle());
        p.setStatus(PaymentStatus.PENDING);
        p.setProvider("VNPAY");
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        paymentRepository.save(p);

        String txnRef = id.toString().replace("-", "");
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Version", VERSION);
        fields.put("vnp_Command", COMMAND);
        fields.put("vnp_TmnCode", vnpay.getTmnCode());
        fields.put("vnp_Amount", String.valueOf(amountMinor));
        fields.put("vnp_CurrCode", "VND");
        fields.put("vnp_TxnRef", txnRef);
        fields.put("vnp_OrderInfo", req.orderInfo());
        fields.put("vnp_OrderType", ORDER_TYPE);
        fields.put("vnp_Locale", "vn");
        fields.put("vnp_ReturnUrl", vnpay.getReturnUrl());
        fields.put("vnp_CreateDate", CREATE_FMT.format(now));
        fields.put("vnp_IpAddr", clientIp);
        if (req.bankCode() != null && !req.bankCode().isBlank()) {
            fields.put("vnp_BankCode", req.bankCode());
        }

        VnPayCrypto.BuildResult built = VnPayCrypto.buildSignedQuery(fields);
        String secureHash = VnPayCrypto.hmacSha512Hex(vnpay.getHashSecret(), built.hashData());
        String paymentUrl = vnpay.getPayUrl() + "?" + built.queryWithoutHash() + "&vnp_SecureHash=" + secureHash;

        return new VnpayCreateResponse(id, paymentUrl);
    }

    public boolean validateSignature(Map<String, String> params) {
        try {
            Map<String, String> copy = new TreeMap<>(params);
            String receivedHash = copy.remove("vnp_SecureHash");
            copy.remove("vnp_SecureHashType");
            if (receivedHash == null) {
                return false;
            }
            VnPayCrypto.BuildResult built = VnPayCrypto.buildSignedQuery(copy);
            String computed = VnPayCrypto.hmacSha512Hex(vnpay.getHashSecret(), built.hashData());
            return constantTimeEquals(
                    receivedHash.toLowerCase(java.util.Locale.ROOT),
                    computed.toLowerCase(java.util.Locale.ROOT));
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] x = a.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] y = b.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (x.length != y.length) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < x.length; i++) {
            r |= x[i] ^ y[i];
        }
        return r == 0;
    }

    /** Cập nhật DB sau khi đã verify chữ ký. */
    @Transactional
    public PaymentStatus applyVerifiedCallback(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            throw new IllegalArgumentException("Thiếu vnp_TxnRef");
        }
        UUID paymentId = uuidFromTxnRef(txnRef);
        Payment p =
                paymentRepository
                        .findById(paymentId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));

        String amountStr = params.get("vnp_Amount");
        if (amountStr != null) {
            long vnpMinor = Long.parseLong(amountStr);
            long expectedMinor = p.getAmount().multiply(BigDecimal.valueOf(100)).longValueExact();
            if (vnpMinor != expectedMinor) {
                throw new IllegalArgumentException("Số tiền không khớp");
            }
        }

        String rsp = params.getOrDefault("vnp_ResponseCode", "");
        String transNo = params.get("vnp_TransactionNo");
        boolean becameCompleted = false;
        if ("00".equals(rsp)) {
            if (p.getStatus() == PaymentStatus.COMPLETED) {
                return PaymentStatus.COMPLETED;
            }
            becameCompleted = true;
            p.setStatus(PaymentStatus.COMPLETED);
            if (transNo != null && !transNo.isBlank()) {
                p.setProviderRef(transNo);
            }
        } else {
            if (p.getStatus() != PaymentStatus.COMPLETED) {
                p.setStatus(PaymentStatus.FAILED);
            }
        }
        p.setUpdatedAt(Instant.now());
        paymentRepository.save(p);
        if (becameCompleted) {
            if (p.getCourseId() != null) {
                courseEnrollmentClient.enrollAfterPayment(p.getUserId(), p.getCourseId());
            } else {
                billingSubscriptionService.applySuccessfulSubscriptionPayment(p);
            }
        }
        return p.getStatus();
    }

    public String frontendRedirectForPayment(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            return vnpay.getFrontendRedirectBase();
        }
        try {
            UUID paymentId = uuidFromTxnRef(txnRef);
            return paymentRepository
                    .findById(paymentId)
                    .map(
                            p -> {
                                if (p.getCourseId() != null) {
                                    String base = vnpay.getFrontendRedirectBase();
                                    int idx = base.indexOf("/payment");
                                    String origin =
                                            idx >= 0 ? base.substring(0, idx) : base.replaceAll("/$", "");
                                    return origin + "/courses/" + p.getCourseId() + "/payment";
                                }
                                return vnpay.getFrontendRedirectBase();
                            })
                    .orElse(vnpay.getFrontendRedirectBase());
        } catch (IllegalArgumentException e) {
            return vnpay.getFrontendRedirectBase();
        }
    }

    private static UUID uuidFromTxnRef(String txnRef) {
        if (txnRef.contains("-")) {
            return UUID.fromString(txnRef);
        }
        if (txnRef.length() != 32) {
            throw new IllegalArgumentException("Mã giao dịch không hợp lệ");
        }
        String s =
                txnRef.substring(0, 8)
                        + "-"
                        + txnRef.substring(8, 12)
                        + "-"
                        + txnRef.substring(12, 16)
                        + "-"
                        + txnRef.substring(16, 20)
                        + "-"
                        + txnRef.substring(20, 32);
        return UUID.fromString(s);
    }

    public String clientIpFrom(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    /** Phản hồi IPN theo format VNPay (JSON). */
    public String buildIpnJson(Map<String, String> params) {
        if (!validateSignature(params)) {
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}";
        }
        try {
            String txnRef = params.get("vnp_TxnRef");
            if (txnRef == null || txnRef.isBlank()) {
                return "{\"RspCode\":\"01\",\"Message\":\"Order not Found\"}";
            }
            UUID paymentId = uuidFromTxnRef(txnRef);
            Payment pay =
                    paymentRepository
                            .findById(paymentId)
                            .orElse(null);
            if (pay == null) {
                return "{\"RspCode\":\"01\",\"Message\":\"Order not Found\"}";
            }
            if ("00".equals(params.get("vnp_ResponseCode"))
                    && pay.getStatus() == PaymentStatus.COMPLETED) {
                return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
            }
            applyVerifiedCallback(params);
            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
        } catch (IllegalArgumentException e) {
            if ("Số tiền không khớp".equals(e.getMessage())) {
                return "{\"RspCode\":\"04\",\"Message\":\"Invalid Amount\"}";
            }
            return "{\"RspCode\":\"01\",\"Message\":\"Order not Found\"}";
        }
    }
}
