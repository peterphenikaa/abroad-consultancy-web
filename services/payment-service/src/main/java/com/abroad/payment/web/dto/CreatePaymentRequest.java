package com.abroad.payment.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentRequest(
        @NotNull @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
        BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3, message = "currency phải là mã 3 ký tự (VD: VND)")
        String currency,
        @Size(max = 500) String description,
        UUID courseId) {}
