package com.abroad.payment.web;

import com.abroad.payment.config.VnpayProperties;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.service.VnPayCheckoutService;
import com.abroad.payment.web.dto.ErrorResponse;
import com.abroad.payment.web.dto.VnpayCreateRequest;
import com.abroad.payment.web.dto.VnpayCreateResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/payments")
public class VnPayPaymentController {

    private final VnPayCheckoutService vnPayCheckoutService;
    private final VnpayProperties vnpayProperties;

    public VnPayPaymentController(
            VnPayCheckoutService vnPayCheckoutService, VnpayProperties vnpayProperties) {
        this.vnPayCheckoutService = vnPayCheckoutService;
        this.vnpayProperties = vnpayProperties;
    }

    @PostMapping("/vnpay/create")
    public ResponseEntity<VnpayCreateResponse> create(
            @RequestHeader("x-user-id") String userId,
            @Valid @RequestBody VnpayCreateRequest body,
            HttpServletRequest req)
            throws Exception {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String ip = vnPayCheckoutService.clientIpFrom(req);
        VnpayCreateResponse res = vnPayCheckoutService.createPaymentUrl(userId, body, ip);
        return ResponseEntity.ok(res);
    }

    /** Trình duyệt user quay lại từ cổng VNPay. */
    @GetMapping("/vnpay/return")
    public RedirectView returnHandler(HttpServletRequest req) {
        Map<String, String> p = toParamMap(req);
        String base = vnpayProperties.getFrontendRedirectBase();
        if (!vnPayCheckoutService.validateSignature(p)) {
            return new RedirectView(base + "?vnpay=checksum");
        }
        try {
            PaymentStatus st = vnPayCheckoutService.applyVerifiedCallback(p);
            String code = p.getOrDefault("vnp_ResponseCode", "");
            String escapedCode = URLEncoder.encode(code, StandardCharsets.UTF_8);
            String statusEnc = URLEncoder.encode(st.name(), StandardCharsets.UTF_8);
            return new RedirectView(
                    base + "?vnpay=1&code=" + escapedCode + "&status=" + statusEnc);
        } catch (IllegalArgumentException e) {
            String msg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            return new RedirectView(base + "?vnpay=error&reason=" + msg);
        }
    }

    @RequestMapping(
            value = "/vnpay/ipn",
            method = {RequestMethod.GET, RequestMethod.POST},
            produces = MediaType.APPLICATION_JSON_VALUE)
    public String ipn(HttpServletRequest req) {
        return vnPayCheckoutService.buildIpnJson(toParamMap(req));
    }

    private static Map<String, String> toParamMap(HttpServletRequest req) {
        Map<String, String> m = new HashMap<>();
        req.getParameterMap()
                .forEach(
                        (k, v) -> {
                            if (v != null && v.length > 0) {
                                m.put(k, v[0]);
                            }
                        });
        return m;
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> notConfigured(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex) {
        String msg =
                ex.getBindingResult().getFieldErrors().stream()
                        .findFirst()
                        .map(f -> f.getDefaultMessage())
                        .orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(new ErrorResponse(false, msg));
    }
}
