package com.abroad.payment.repository;

import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.PaymentStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndCourseIdAndStatus(String userId, UUID courseId, PaymentStatus status);
}
