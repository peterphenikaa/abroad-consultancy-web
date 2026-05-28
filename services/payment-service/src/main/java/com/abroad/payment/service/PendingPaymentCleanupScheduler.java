package com.abroad.payment.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PendingPaymentCleanupScheduler {

    private final PendingPaymentCleanupService cleanupService;

    public PendingPaymentCleanupScheduler(PendingPaymentCleanupService cleanupService) {
        this.cleanupService = cleanupService;
    }

    /** Runs every minute; removes PENDING rows past the configured TTL (default 15 minutes). */
    @Scheduled(cron = "${app.payment.pending-cleanup-cron:0 * * * * *}")
    public void runPendingCleanup() {
        cleanupService.deleteExpiredPending();
    }
}
