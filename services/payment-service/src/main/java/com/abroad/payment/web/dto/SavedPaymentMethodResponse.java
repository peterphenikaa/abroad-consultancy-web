package com.abroad.payment.web.dto;

public record SavedPaymentMethodResponse(
        String provider, String brand, String bankCode, String last4, String maskedDisplay) {}
