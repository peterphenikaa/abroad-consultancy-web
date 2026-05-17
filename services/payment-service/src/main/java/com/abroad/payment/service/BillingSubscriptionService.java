package com.abroad.payment.service;

import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.UserSubscription;
import com.abroad.payment.repository.UserSubscriptionRepository;
import com.abroad.payment.web.dto.SubscriptionMeResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingSubscriptionService {

    private static final int MONTHLY_DAYS = 30;
    private static final int ANNUAL_DAYS = 365;

    private final UserSubscriptionRepository userSubscriptionRepository;

    public BillingSubscriptionService(UserSubscriptionRepository userSubscriptionRepository) {
        this.userSubscriptionRepository = userSubscriptionRepository;
    }

    @Transactional
    public SubscriptionMeResponse getOrCreateForUser(String userId) {
        return userSubscriptionRepository
                .findById(userId)
                .map(this::toResponse)
                .orElseGet(
                        () -> {
                            Instant now = Instant.now();
                            UserSubscription u = new UserSubscription();
                            u.setUserId(userId);
                            u.setPlanCode("basic");
                            u.setBillingCycle("monthly");
                            u.setExpiresAt(now.plus(MONTHLY_DAYS, ChronoUnit.DAYS));
                            u.setCreatedAt(now);
                            u.setUpdatedAt(now);
                            return toResponse(userSubscriptionRepository.save(u));
                        });
    }

    @Transactional
    public void applySuccessfulSubscriptionPayment(Payment p) {
        if (p.getPlanCode() == null || p.getPlanCode().isBlank()) {
            return;
        }
        if (p.getBillingCycle() == null || p.getBillingCycle().isBlank()) {
            return;
        }
        int addDays = "annual".equalsIgnoreCase(p.getBillingCycle()) ? ANNUAL_DAYS : MONTHLY_DAYS;
        Instant exp = Instant.now().plus(addDays, ChronoUnit.DAYS);
        Instant now = Instant.now();

        UserSubscription u =
                userSubscriptionRepository
                        .findById(p.getUserId())
                        .orElseGet(
                                () -> {
                                    UserSubscription n = new UserSubscription();
                                    n.setUserId(p.getUserId());
                                    n.setCreatedAt(now);
                                    return n;
                                });

        u.setPlanCode(p.getPlanCode());
        u.setBillingCycle(p.getBillingCycle().toLowerCase());
        u.setExpiresAt(exp);
        u.setUpdatedAt(now);
        if (u.getCreatedAt() == null) {
            u.setCreatedAt(now);
        }
        userSubscriptionRepository.save(u);
    }

    private SubscriptionMeResponse toResponse(UserSubscription u) {
        return new SubscriptionMeResponse(
                u.getUserId(), u.getPlanCode(), u.getBillingCycle(), u.getExpiresAt());
    }
}
