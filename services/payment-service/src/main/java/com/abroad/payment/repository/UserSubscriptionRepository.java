package com.abroad.payment.repository;

import com.abroad.payment.domain.UserSubscription;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, String> {

    @Query(
            """
            SELECT s FROM UserSubscription s
            WHERE s.cancelAtPeriodEnd = false
              AND s.autoRenewEnabled = true
              AND s.expiresAt <= :now
              AND (s.lastRenewalAttemptAt IS NULL OR s.lastRenewalAttemptAt < s.expiresAt)
            """)
    List<UserSubscription> findDueForAutoRenewal(@Param("now") Instant now);
}
