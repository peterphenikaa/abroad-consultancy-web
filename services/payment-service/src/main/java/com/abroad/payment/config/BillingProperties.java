package com.abroad.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.billing")
public class BillingProperties {

    /** Master switch for scheduled auto-renewal job. */
    private boolean autoRenewEnabled = true;

    /**
     * Sandbox/dev: simulate declined renewal charge (insufficient funds).
     * Production should use VNPay Recurring API instead.
     */
    private boolean simulateInsufficientFunds = false;

    public boolean isAutoRenewEnabled() {
        return autoRenewEnabled;
    }

    public void setAutoRenewEnabled(boolean autoRenewEnabled) {
        this.autoRenewEnabled = autoRenewEnabled;
    }

    public boolean isSimulateInsufficientFunds() {
        return simulateInsufficientFunds;
    }

    public void setSimulateInsufficientFunds(boolean simulateInsufficientFunds) {
        this.simulateInsufficientFunds = simulateInsufficientFunds;
    }
}
