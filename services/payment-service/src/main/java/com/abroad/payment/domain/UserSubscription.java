package com.abroad.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "user_subscriptions")
public class UserSubscription {

    @Id
    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @Column(name = "plan_code", nullable = false, length = 32)
    private String planCode;

    @Column(name = "billing_cycle", nullable = false, length = 16)
    private String billingCycle;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** true = user cancelled auto-renewal; access continues until expires_at. */
    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd = false;

    @Column(name = "auto_renew_enabled", nullable = false)
    private boolean autoRenewEnabled = true;

    @Column(name = "last_renewal_attempt_at")
    private Instant lastRenewalAttemptAt;

    @Column(name = "renewal_failure_reason", length = 500)
    private String renewalFailureReason;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(String billingCycle) {
        this.billingCycle = billingCycle;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isCancelAtPeriodEnd() {
        return cancelAtPeriodEnd;
    }

    public void setCancelAtPeriodEnd(boolean cancelAtPeriodEnd) {
        this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    public boolean isAutoRenewEnabled() {
        return autoRenewEnabled;
    }

    public void setAutoRenewEnabled(boolean autoRenewEnabled) {
        this.autoRenewEnabled = autoRenewEnabled;
    }

    public Instant getLastRenewalAttemptAt() {
        return lastRenewalAttemptAt;
    }

    public void setLastRenewalAttemptAt(Instant lastRenewalAttemptAt) {
        this.lastRenewalAttemptAt = lastRenewalAttemptAt;
    }

    public String getRenewalFailureReason() {
        return renewalFailureReason;
    }

    public void setRenewalFailureReason(String renewalFailureReason) {
        this.renewalFailureReason = renewalFailureReason;
    }
}
