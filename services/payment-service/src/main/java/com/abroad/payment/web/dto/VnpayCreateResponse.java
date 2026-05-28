package com.abroad.payment.web.dto;

import java.util.UUID;

public record VnpayCreateResponse(UUID paymentId, String paymentUrl) {}
