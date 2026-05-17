package com.abroad.payment.repository;

import com.abroad.payment.domain.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, String> {}
