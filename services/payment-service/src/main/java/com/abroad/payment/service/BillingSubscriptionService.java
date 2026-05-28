package com.abroad.payment.service;

import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.UserSubscription;
import com.abroad.payment.repository.UserSubscriptionRepository;
import com.abroad.payment.web.dto.SavedPaymentMethodResponse;
import com.abroad.payment.web.dto.SubscriptionMeResponse;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingSubscriptionService {

    private static final ZoneId BILLING_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final Map<String, Integer> PLAN_TIER =
            Map.of("basic", 0, "pro", 1, "premium", 2);

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SavedPaymentMethodService savedPaymentMethodService;

    public BillingSubscriptionService(
            UserSubscriptionRepository userSubscriptionRepository,
            SavedPaymentMethodService savedPaymentMethodService) {
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.savedPaymentMethodService = savedPaymentMethodService;
    }

    /** Chỉ đọc — không tự tạo gói miễn phí. */
    public Optional<SubscriptionMeResponse> getForUser(String userId) {
        return userSubscriptionRepository.findById(userId).map(this::toResponse);
    }

    /**
     * Kiểm tra trước khi tạo link VNPay cho gói đăng ký.
     * Cho phép: mua mới, gia hạn (hết hạn), nâng cấp tier, đổi chu kỳ cùng tier.
     * Từ chối: hạ cấp khi còn hạn, mua trùng gói + chu kỳ đang active.
     */
    public void validateSubscriptionCheckout(String userId, String planCode, String billingCycle) {
        Optional<UserSubscription> existing = userSubscriptionRepository.findById(userId);
        if (existing.isEmpty()) {
            return;
        }
        UserSubscription sub = existing.get();
        if (!isActive(sub)) {
            return;
        }

        String currentPlan = normalizePlan(sub.getPlanCode());
        String currentCycle = normalizeCycle(sub.getBillingCycle());
        String newPlan = normalizePlan(planCode);
        String newCycle = normalizeCycle(billingCycle);

        int currentTier = tier(currentPlan);
        int newTier = tier(newPlan);

        if (newTier < currentTier) {
            throw new IllegalArgumentException(
                    "Không thể hạ cấp gói khi subscription còn hiệu lực. Vui lòng đợi hết hạn.");
        }
        if (newTier == currentTier && newPlan.equals(currentPlan) && newCycle.equals(currentCycle)) {
            throw new IllegalArgumentException("Bạn đang sử dụng gói và chu kỳ thanh toán này.");
        }
    }

    @Transactional
    public void applySuccessfulSubscriptionPayment(Payment p) {
        if (p.getPlanCode() == null || p.getPlanCode().isBlank()) {
            return;
        }
        if (p.getBillingCycle() == null || p.getBillingCycle().isBlank()) {
            return;
        }

        Instant now = Instant.now();
        String planCode = normalizePlan(p.getPlanCode());
        String billingCycle = normalizeCycle(p.getBillingCycle());
        Instant expiresAt = computeExpiresAt(now, billingCycle);

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

        u.setPlanCode(planCode);
        u.setBillingCycle(billingCycle);
        u.setExpiresAt(expiresAt);
        u.setCancelAtPeriodEnd(false);
        u.setAutoRenewEnabled(true);
        u.setRenewalFailureReason(null);
        u.setUpdatedAt(now);
        if (u.getCreatedAt() == null) {
            u.setCreatedAt(now);
        }
        userSubscriptionRepository.save(u);
    }

    /** Gia hạn thành công bằng thẻ đã lưu (auto-renew). */
    @Transactional
    public void applySuccessfulRenewal(UserSubscription sub, Instant now) {
        Instant base =
                sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(now)
                        ? sub.getExpiresAt()
                        : now;
        sub.setExpiresAt(computeExpiresAt(base, sub.getBillingCycle()));
        sub.setCancelAtPeriodEnd(false);
        sub.setAutoRenewEnabled(true);
        sub.setRenewalFailureReason(null);
        sub.setUpdatedAt(now);
        userSubscriptionRepository.save(sub);
    }

    /** Hủy gia hạn — user vẫn active đến expires_at; không charge thẻ đã lưu nữa. */
    @Transactional
    public SubscriptionMeResponse cancelAtPeriodEnd(String userId) {
        UserSubscription u =
                userSubscriptionRepository
                        .findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("Không tìm thấy gói đăng ký"));
        if (!isActive(u)) {
            throw new IllegalArgumentException("Gói đã hết hạn, không cần hủy");
        }
        if (u.isCancelAtPeriodEnd()) {
            return toResponse(u);
        }
        u.setCancelAtPeriodEnd(true);
        u.setAutoRenewEnabled(false);
        u.setUpdatedAt(Instant.now());
        return toResponse(userSubscriptionRepository.save(u));
    }

    static Instant computeExpiresAt(Instant from, String billingCycle) {
        ZonedDateTime zdt = from.atZone(BILLING_ZONE);
        if ("annual".equalsIgnoreCase(billingCycle)) {
            return zdt.plusYears(1).toInstant();
        }
        return zdt.plusMonths(1).toInstant();
    }

    static boolean isActive(UserSubscription sub) {
        return sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(Instant.now());
    }

    private SubscriptionMeResponse toResponse(UserSubscription u) {
        SavedPaymentMethodResponse saved =
                savedPaymentMethodService
                        .getForUser(u.getUserId())
                        .orElse(null);
        return new SubscriptionMeResponse(
                u.getUserId(),
                u.getPlanCode(),
                u.getBillingCycle(),
                u.getExpiresAt(),
                isActive(u),
                u.isCancelAtPeriodEnd(),
                u.isAutoRenewEnabled() && !u.isCancelAtPeriodEnd(),
                u.getRenewalFailureReason(),
                saved);
    }

    private static String normalizePlan(String planCode) {
        if (planCode == null || planCode.isBlank()) {
            throw new IllegalArgumentException("planCode không hợp lệ");
        }
        return planCode.trim().toLowerCase();
    }

    private static String normalizeCycle(String billingCycle) {
        if (billingCycle == null || billingCycle.isBlank()) {
            throw new IllegalArgumentException("billingCycle không hợp lệ");
        }
        return billingCycle.trim().toLowerCase();
    }

    private static int tier(String planCode) {
        Integer t = PLAN_TIER.get(planCode);
        if (t == null) {
            throw new IllegalArgumentException("Gói không hợp lệ: " + planCode);
        }
        return t;
    }
}
