package com.abroad.payment.service;

import com.abroad.payment.config.VnpayProperties;
import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.UserPaymentMethod;
import com.abroad.payment.repository.UserPaymentMethodRepository;
import com.abroad.payment.web.dto.SavedPaymentMethodResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SavedPaymentMethodService {

    private final UserPaymentMethodRepository repository;
    private final VnpayProperties vnpayProperties;

    public SavedPaymentMethodService(
            UserPaymentMethodRepository repository, VnpayProperties vnpayProperties) {
        this.repository = repository;
        this.vnpayProperties = vnpayProperties;
    }

    public Optional<SavedPaymentMethodResponse> getForUser(String userId) {
        return repository.findByUserId(userId).map(this::toResponse);
    }

    @Transactional
    public void saveFromSuccessfulVnPayPayment(
            String userId, Map<String, String> vnpParams, Payment payment) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        if (payment.getCourseId() != null) {
            return;
        }

        Instant now = Instant.now();
        String bankCode =
                firstNonBlank(
                        vnpParams.get("vnp_BankCode"),
                        payment.getProvider() != null ? payment.getProvider() : null,
                        "NCB");
        String brand = firstNonBlank(vnpParams.get("vnp_CardType"), bankCode, "CARD");
        String last4 = deriveLast4(vnpParams);
        String transNo = firstNonBlank(vnpParams.get("vnp_TransactionNo"), payment.getProviderRef(), payment.getId().toString());
        String tokenRef = buildTokenRef(userId, transNo);

        UserPaymentMethod method =
                repository
                        .findByUserId(userId)
                        .orElseGet(
                                () -> {
                                    UserPaymentMethod m = new UserPaymentMethod();
                                    m.setId(UUID.randomUUID());
                                    m.setUserId(userId);
                                    m.setCreatedAt(now);
                                    return m;
                                });

        method.setProvider("VNPAY");
        method.setTokenRef(tokenRef);
        method.setBrand(brand);
        method.setBankCode(bankCode);
        method.setLast4(last4);
        method.setUpdatedAt(now);
        repository.save(method);
    }

    private SavedPaymentMethodResponse toResponse(UserPaymentMethod m) {
        String masked =
                "**** **** **** "
                        + (m.getLast4() != null && !m.getLast4().isBlank() ? m.getLast4() : "****");
        return new SavedPaymentMethodResponse(
                m.getProvider(), m.getBrand(), m.getBankCode(), m.getLast4(), masked);
    }

    private String buildTokenRef(String userId, String transNo) {
        try {
            String secret = vnpayProperties.getHashSecret() != null ? vnpayProperties.getHashSecret() : "dev";
            String payload = userId + "|" + transNo + "|" + secret;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return "vnp_tok_" + HexFormat.of().formatHex(hash).substring(0, 40);
        } catch (Exception e) {
            return "vnp_tok_" + UUID.randomUUID().toString().replace("-", "");
        }
    }

    private static String deriveLast4(Map<String, String> vnpParams) {
        String raw = vnpParams.get("vnp_CardNumber");
        if (raw != null) {
            String digits = raw.replaceAll("\\D", "");
            if (digits.length() >= 4) {
                return digits.substring(digits.length() - 4);
            }
        }
        return "2198";
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return "";
    }
}
