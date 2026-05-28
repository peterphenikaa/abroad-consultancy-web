package com.abroad.payment.service;

import com.abroad.payment.config.PaymentProperties;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.repository.PaymentRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PendingPaymentCleanupService {

    private static final Logger log = LoggerFactory.getLogger(PendingPaymentCleanupService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentProperties paymentProperties;

    public PendingPaymentCleanupService(
            PaymentRepository paymentRepository, PaymentProperties paymentProperties) {
        this.paymentRepository = paymentRepository;
        this.paymentProperties = paymentProperties;
    }

    /** Deletes PENDING payments older than {@link PaymentProperties#getPendingTtlMinutes()}. */
    @Transactional
    public int deleteExpiredPending() {
        if (!paymentProperties.isPendingCleanupEnabled()) {
            return 0;
        }
        int ttlMinutes = Math.max(1, paymentProperties.getPendingTtlMinutes());
        Instant cutoff = Instant.now().minus(ttlMinutes, ChronoUnit.MINUTES);
        int deleted =
                paymentRepository.deleteByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff);
        if (deleted > 0) {
            log.info("Deleted {} expired PENDING payment(s) older than {} minutes", deleted, ttlMinutes);
        }
        return deleted;
    }
}
