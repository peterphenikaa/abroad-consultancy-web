package com.abroad.payment.service;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class BillingPricingService {

    private static final long USD_VND_RATE = 25_000L;

    public BigDecimal planAmountVnd(String planCode, String billingCycle) {
        long usd =
                switch (normalizePlan(planCode)) {
                    case "basic" -> 29L;
                    case "pro" -> 79L;
                    case "premium" -> 149L;
                    default -> throw new IllegalArgumentException("Unknown plan: " + planCode);
                };
        if ("annual".equalsIgnoreCase(billingCycle)) {
            usd = Math.round(usd * 0.8 * 12);
        }
        return BigDecimal.valueOf(usd * USD_VND_RATE);
    }

    private static String normalizePlan(String planCode) {
        return planCode == null ? "" : planCode.trim().toLowerCase();
    }
}
