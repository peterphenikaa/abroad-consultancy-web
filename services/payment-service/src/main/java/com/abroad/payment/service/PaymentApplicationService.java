package com.abroad.payment.service;

import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.repository.PaymentRepository;
import com.abroad.payment.web.dto.CreatePaymentRequest;
import com.abroad.payment.web.dto.PaymentResponse;
import com.abroad.payment.web.dto.WebhookPaymentRequest;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentApplicationService {

    private final PaymentRepository paymentRepository;

    public PaymentApplicationService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public PaymentResponse create(String userId, CreatePaymentRequest request) {
        Instant now = Instant.now();
        Payment p = new Payment();
        p.setId(UUID.randomUUID());
        p.setUserId(userId);
        p.setCourseId(request.courseId());
        p.setAmount(request.amount());
        p.setCurrency(request.currency().toUpperCase());
        p.setDescription(request.description());
        p.setStatus(PaymentStatus.PENDING);
        p.setProvider("INTERNAL");
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        return toResponse(paymentRepository.save(p));
    }

    @Transactional(readOnly = true)
    public PaymentResponse getById(UUID id, String userId) {
        Payment p =
                paymentRepository
                        .findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));
        if (!p.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền xem giao dịch này");
        }
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listForUser(String userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse applyWebhook(WebhookPaymentRequest body) {
        Payment p =
                paymentRepository
                        .findById(body.paymentId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));
        if (body.status() != PaymentStatus.COMPLETED && body.status() != PaymentStatus.FAILED) {
            throw new IllegalArgumentException("Webhook chỉ chấp nhận COMPLETED hoặc FAILED");
        }
        if (p.getStatus() == PaymentStatus.COMPLETED || p.getStatus() == PaymentStatus.FAILED) {
            throw new IllegalArgumentException("Giao dịch đã kết thúc, không cập nhật lại");
        }
        p.setStatus(body.status());
        if (body.providerRef() != null && !body.providerRef().isBlank()) {
            p.setProviderRef(body.providerRef());
        }
        p.setUpdatedAt(Instant.now());
        return toResponse(paymentRepository.save(p));
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getUserId(),
                p.getCourseId(),
                p.getAmount(),
                p.getCurrency(),
                p.getDescription(),
                p.getStatus(),
                p.getProvider(),
                p.getProviderRef(),
                p.getPlanCode(),
                p.getBillingCycle(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
