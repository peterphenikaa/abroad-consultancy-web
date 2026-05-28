package com.abroad.payment.web.dto;

import com.abroad.payment.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        String userId,
        UUID courseId,
        BigDecimal amount,
        String currency,
        String description,
        PaymentStatus status,
        String provider,
        String providerRef,
        String planCode,
        String billingCycle,
        Instant createdAt,
        Instant updatedAt) {}
