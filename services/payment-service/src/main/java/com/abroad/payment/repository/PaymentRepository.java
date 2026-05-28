package com.abroad.payment.repository;

import com.abroad.payment.domain.Payment;
import com.abroad.payment.domain.PaymentStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndCourseIdAndStatus(String userId, UUID courseId, PaymentStatus status);

    @Modifying
    @Query("DELETE FROM Payment p WHERE p.status = :status AND p.createdAt < :cutoff")
    int deleteByStatusAndCreatedAtBefore(
            @Param("status") PaymentStatus status, @Param("cutoff") Instant cutoff);
}
