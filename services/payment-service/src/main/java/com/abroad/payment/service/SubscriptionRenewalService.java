package com.abroad.payment.service;

import com.abroad.payment.config.BillingProperties;
import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.domain.UserPaymentMethod;
import com.abroad.payment.domain.UserSubscription;
import com.abroad.payment.repository.PaymentRepository;
import com.abroad.payment.repository.UserPaymentMethodRepository;
import com.abroad.payment.repository.UserSubscriptionRepository;
import com.abroad.payment.service.SavedCardChargeService.ChargeResult;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionRenewalService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionRenewalService.class);

    private final UserSubscriptionRepository subscriptionRepository;
    private final UserPaymentMethodRepository paymentMethodRepository;
    private final PaymentRepository paymentRepository;
    private final BillingPricingService billingPricingService;
    private final SavedCardChargeService savedCardChargeService;
    private final BillingSubscriptionService billingSubscriptionService;
    private final BillingProperties billingProperties;

    public SubscriptionRenewalService(
            UserSubscriptionRepository subscriptionRepository,
            UserPaymentMethodRepository paymentMethodRepository,
            PaymentRepository paymentRepository,
            BillingPricingService billingPricingService,
            SavedCardChargeService savedCardChargeService,
            BillingSubscriptionService billingSubscriptionService,
            BillingProperties billingProperties) {
        this.subscriptionRepository = subscriptionRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.paymentRepository = paymentRepository;
        this.billingPricingService = billingPricingService;
        this.savedCardChargeService = savedCardChargeService;
        this.billingSubscriptionService = billingSubscriptionService;
        this.billingProperties = billingProperties;
    }

    @Transactional
    public int processDueRenewals() {
        if (!billingProperties.isAutoRenewEnabled()) {
            return 0;
        }
        Instant now = Instant.now();
        List<UserSubscription> due = subscriptionRepository.findDueForAutoRenewal(now);
        int processed = 0;
        for (UserSubscription sub : due) {
            attemptRenewal(sub, now);
            processed++;
        }
        return processed;
    }

    @Transactional
    public void attemptRenewalForUser(String userId) {
        UserSubscription sub =
                subscriptionRepository
                        .findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        if (sub.isCancelAtPeriodEnd()) {
            throw new IllegalArgumentException("Auto-renewal is cancelled for this plan.");
        }
        attemptRenewal(sub, Instant.now());
    }

    private void attemptRenewal(UserSubscription sub, Instant now) {
        sub.setLastRenewalAttemptAt(now);
        sub.setRenewalFailureReason(null);

        Optional<UserPaymentMethod> methodOpt = paymentMethodRepository.findByUserId(sub.getUserId());
        if (methodOpt.isEmpty()) {
            failRenewal(sub, now, null, "No saved payment method on file.");
            return;
        }

        BigDecimal amountVnd = billingPricingService.planAmountVnd(sub.getPlanCode(), sub.getBillingCycle());
        UserPaymentMethod method = methodOpt.get();
        ChargeResult charge = savedCardChargeService.charge(method.getTokenRef(), amountVnd, sub.getUserId());

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setUserId(sub.getUserId());
        payment.setAmount(amountVnd);
        payment.setCurrency("VND");
        payment.setDescription("Auto-renewal " + sub.getPlanCode() + " " + sub.getBillingCycle());
        payment.setPlanCode(sub.getPlanCode());
        payment.setBillingCycle(sub.getBillingCycle());
        payment.setProvider("VNPAY");
        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);

        if (!charge.success()) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            failRenewal(sub, now, payment, charge.failureReason());
            return;
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setProviderRef(charge.providerRef());
        paymentRepository.save(payment);

        billingSubscriptionService.applySuccessfulRenewal(sub, now);
        sub.setRenewalFailureReason(null);
        sub.setAutoRenewEnabled(true);
        subscriptionRepository.save(sub);
        log.info("Auto-renewal succeeded for user {}", sub.getUserId());
    }

    private void failRenewal(UserSubscription sub, Instant now, Payment payment, String reason) {
        sub.setRenewalFailureReason(reason != null ? reason : "Renewal failed.");
        subscriptionRepository.save(sub);
        log.warn("Auto-renewal failed for user {}: {}", sub.getUserId(), sub.getRenewalFailureReason());
    }
}
