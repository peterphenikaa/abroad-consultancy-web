package com.abroad.payment.service;

import com.abroad.payment.config.BillingProperties;
import com.abroad.payment.config.VnpayProperties;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Charges a saved payment method. Sandbox uses simulation; production should call VNPay Recurring
 * Payment API with {@code tokenRef}.
 */
@Service
public class SavedCardChargeService {

    private static final Logger log = LoggerFactory.getLogger(SavedCardChargeService.class);

    private final BillingProperties billingProperties;
    private final VnpayProperties vnpayProperties;

    public SavedCardChargeService(BillingProperties billingProperties, VnpayProperties vnpayProperties) {
        this.billingProperties = billingProperties;
        this.vnpayProperties = vnpayProperties;
    }

    public ChargeResult charge(String tokenRef, BigDecimal amountVnd, String userId) {
        if (tokenRef == null || tokenRef.isBlank()) {
            return ChargeResult.failure("No saved payment token.");
        }
        if (amountVnd == null || amountVnd.compareTo(BigDecimal.ONE) < 0) {
            return ChargeResult.failure("Invalid renewal amount.");
        }

        if (billingProperties.isSimulateInsufficientFunds()) {
            log.info("Simulated insufficient funds for user {} amount {}", userId, amountVnd);
            return ChargeResult.failure("Insufficient funds on saved card.");
        }

        if (!vnpayProperties.isConfigured()) {
            return ChargeResult.failure("Payment provider is not configured.");
        }

        // Placeholder for VNPay Recurring / token charge API integration.
        String providerRef = "renew_" + System.currentTimeMillis();
        log.info(
                "Simulated successful token charge user={} token={} amount={} ref={}",
                userId,
                tokenRef.substring(0, Math.min(8, tokenRef.length())),
                amountVnd,
                providerRef);
        return ChargeResult.success(providerRef);
    }

    public record ChargeResult(boolean success, String providerRef, String failureReason) {
        static ChargeResult success(String providerRef) {
            return new ChargeResult(true, providerRef, null);
        }

        static ChargeResult failure(String reason) {
            return new ChargeResult(false, null, reason);
        }
    }
}
