package com.abroad.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.payment")
public class PaymentProperties {

    /** How long a PENDING payment is kept before automatic deletion. */
    private int pendingTtlMinutes = 15;

    private boolean pendingCleanupEnabled = true;

    public int getPendingTtlMinutes() {
        return pendingTtlMinutes;
    }

    public void setPendingTtlMinutes(int pendingTtlMinutes) {
        this.pendingTtlMinutes = pendingTtlMinutes;
    }

    public boolean isPendingCleanupEnabled() {
        return pendingCleanupEnabled;
    }

    public void setPendingCleanupEnabled(boolean pendingCleanupEnabled) {
        this.pendingCleanupEnabled = pendingCleanupEnabled;
    }
}
