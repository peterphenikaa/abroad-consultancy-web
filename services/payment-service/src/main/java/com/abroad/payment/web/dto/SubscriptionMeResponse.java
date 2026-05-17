package com.abroad.payment.web.dto;

import java.time.Instant;

public record SubscriptionMeResponse(
        String userId, String planCode, String billingCycle, Instant expiresAt) {}
