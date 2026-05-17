package com.abroad.payment.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record VnpayCreateRequest(
        @NotNull @DecimalMin(value = "1", message = "Số tiền tối thiểu 1 VND")
        BigDecimal amountVnd,
        @NotBlank @Size(max = 240) String orderInfo,
        UUID courseId,
        @Size(max = 20) String bankCode,
        @NotBlank
                @Pattern(
                        regexp = "basic|pro|premium",
                        message = "planCode phải là basic, pro hoặc premium")
                String planCode,
        @NotBlank
                @Pattern(
                        regexp = "monthly|annual",
                        message = "billingCycle phải là monthly hoặc annual")
                String billingCycle) {}
