package com.abroad.payment.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CourseAccessResponse(
        UUID courseId,
        String title,
        BigDecimal price,
        boolean isFree,
        boolean hasAccess,
        boolean enrolled,
        boolean paid,
        boolean requiresLogin) {}
