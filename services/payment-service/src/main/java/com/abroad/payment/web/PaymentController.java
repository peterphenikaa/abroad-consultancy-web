package com.abroad.payment.web;

import com.abroad.payment.service.BillingSubscriptionService;
import com.abroad.payment.service.PaymentApplicationService;
import com.abroad.payment.web.dto.CreatePaymentRequest;
import com.abroad.payment.web.dto.ErrorResponse;
import com.abroad.payment.web.dto.PaymentResponse;
import com.abroad.payment.web.dto.SubscriptionMeResponse;
import com.abroad.payment.web.dto.WebhookPaymentRequest;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final String WEBHOOK_HEADER = "X-Payment-Webhook-Secret";

    private final PaymentApplicationService paymentService;
    private final BillingSubscriptionService billingSubscriptionService;
    private final byte[] webhookSecretBytes;

    public PaymentController(
            PaymentApplicationService paymentService,
            BillingSubscriptionService billingSubscriptionService,
            @Value("${app.webhook.secret}") String webhookSecretValue) {
        this.paymentService = paymentService;
        this.billingSubscriptionService = billingSubscriptionService;
        this.webhookSecretBytes = webhookSecretValue.getBytes(StandardCharsets.UTF_8);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "payment-service"));
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> create(
            @RequestHeader("x-user-id") String userId,
            @Valid @RequestBody CreatePaymentRequest body) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.create(userId, body));
    }

    @GetMapping
    public List<PaymentResponse> list(@RequestHeader("x-user-id") String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Thiếu thông tin người dùng");
        }
        return paymentService.listForUser(userId);
    }

    /** Đăng ký theo user (JWT sub → x-user-id); mỗi user một dòng, tạo mặc định basic nếu chưa có. */
    @GetMapping("/subscription/me")
    public ResponseEntity<SubscriptionMeResponse> subscriptionMe(
            @RequestHeader("x-user-id") String userId) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(billingSubscriptionService.getOrCreateForUser(userId));
    }

    @GetMapping("/{id}")
    public PaymentResponse getOne(
            @RequestHeader("x-user-id") String userId, @PathVariable UUID id) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Thiếu thông tin người dùng");
        }
        return paymentService.getById(id, userId);
    }

    @PostMapping("/webhook")
    public PaymentResponse webhook(
            @RequestHeader(WEBHOOK_HEADER) String secret,
            @Valid @RequestBody WebhookPaymentRequest body) {
        if (!constantTimeEquals(secret, webhookSecretBytes)) {
            throw new SecurityException("Chữ ký webhook không hợp lệ");
        }
        return paymentService.applyWebhook(body);
    }

    private static boolean constantTimeEquals(String header, byte[] expected) {
        if (header == null) {
            return false;
        }
        byte[] a = header.getBytes(StandardCharsets.UTF_8);
        if (a.length != expected.length) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < a.length; i++) {
            r |= a[i] ^ expected[i];
        }
        return r == 0;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ErrorResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> forbidden(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
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
