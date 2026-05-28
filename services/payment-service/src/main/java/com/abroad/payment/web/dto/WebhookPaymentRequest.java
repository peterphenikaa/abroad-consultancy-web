package com.abroad.payment.web.dto;

import com.abroad.payment.domain.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record WebhookPaymentRequest(
        @NotNull UUID paymentId,
        @NotNull PaymentStatus status,
        String providerRef) {}
