package com.abroad.payment.service;

import com.abroad.payment.client.CourseEnrollmentClient;
import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.repository.PaymentRepository;
import com.abroad.payment.web.dto.CourseAccessResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CourseAccessService {

    private final RestTemplate restTemplate;
    private final PaymentRepository paymentRepository;
    private final CourseEnrollmentClient courseEnrollmentClient;
    private final ObjectMapper objectMapper;
    private final String contentServiceBaseUrl;

    public CourseAccessService(
            RestTemplate restTemplate,
            PaymentRepository paymentRepository,
            CourseEnrollmentClient courseEnrollmentClient,
            ObjectMapper objectMapper,
            @Value("${app.content-service.url:http://content-service:3000}") String contentServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.paymentRepository = paymentRepository;
        this.courseEnrollmentClient = courseEnrollmentClient;
        this.objectMapper = objectMapper;
        this.contentServiceBaseUrl = contentServiceBaseUrl.replaceAll("/$", "");
    }

    public CourseAccessResponse getAccess(String userId, UUID courseId) {
        HttpHeaders headers = new HttpHeaders();
        if (userId != null && !userId.isBlank()) {
            headers.set("x-user-id", userId);
        }
        String url = contentServiceBaseUrl + "/api/v1/courses/" + courseId + "/access";
        ResponseEntity<String> res =
                restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
        try {
            JsonNode root = objectMapper.readTree(res.getBody());
            JsonNode data = root.path("data");
            boolean isFree = data.path("isFree").asBoolean(false);
            boolean enrolled = data.path("enrolled").asBoolean(false);
            boolean requiresLogin = data.path("requiresLogin").asBoolean(userId == null || userId.isBlank());
            boolean hasAccess = isFree || data.path("hasAccess").asBoolean(false);
            if (!isFree && (userId == null || userId.isBlank())) {
                hasAccess = false;
            }
            boolean paidLocally =
                    userId != null
                            && !userId.isBlank()
                            && paymentRepository.existsByUserIdAndCourseIdAndStatus(
                                    userId, courseId, PaymentStatus.COMPLETED);
            if (paidLocally && !enrolled) {
                courseEnrollmentClient.enrollAfterPayment(userId, courseId);
                enrolled = true;
            }
            if (paidLocally) {
                hasAccess = true;
            }
            return new CourseAccessResponse(
                    UUID.fromString(data.path("courseId").asText(courseId.toString())),
                    data.path("title").asText(null),
                    new BigDecimal(data.path("price").asText("0")),
                    isFree,
                    hasAccess,
                    enrolled,
                    paidLocally || data.path("paid").asBoolean(false),
                    requiresLogin);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể kiểm tra quyền truy cập khóa học", e);
        }
    }
}
