package com.abroad.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_payment_methods")
public class UserPaymentMethod {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, length = 255)
    private String userId;

    @Column(nullable = false, length = 32)
    private String provider = "VNPAY";

    @Column(name = "token_ref", nullable = false, length = 255)
    private String tokenRef;

    @Column(length = 64)
    private String brand;

    @Column(name = "bank_code", length = 32)
    private String bankCode;

    @Column(length = 4)
    private String last4;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getTokenRef() {
        return tokenRef;
    }

    public void setTokenRef(String tokenRef) {
        this.tokenRef = tokenRef;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getLast4() {
        return last4;
    }

    public void setLast4(String last4) {
        this.last4 = last4;
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
}
