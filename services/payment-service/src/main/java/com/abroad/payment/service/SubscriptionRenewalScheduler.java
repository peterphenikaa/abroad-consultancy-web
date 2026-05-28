package com.abroad.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionRenewalScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionRenewalScheduler.class);

    private final SubscriptionRenewalService renewalService;

    public SubscriptionRenewalScheduler(SubscriptionRenewalService renewalService) {
        this.renewalService = renewalService;
    }

    /** Check hourly for subscriptions that expired and need auto-renewal. */
    @Scheduled(cron = "${app.billing.renewal-cron:0 0 * * * *}")
    public void runAutoRenewals() {
        int count = renewalService.processDueRenewals();
        if (count > 0) {
            log.info("Processed {} subscription auto-renewal(s)", count);
        }
    }
}
