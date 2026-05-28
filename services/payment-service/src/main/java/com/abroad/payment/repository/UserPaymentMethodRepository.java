package com.abroad.payment.repository;

import com.abroad.payment.domain.UserPaymentMethod;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPaymentMethodRepository extends JpaRepository<UserPaymentMethod, UUID> {
    Optional<UserPaymentMethod> findByUserId(String userId);
}
