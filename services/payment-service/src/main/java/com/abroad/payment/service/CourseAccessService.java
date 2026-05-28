package com.abroad.payment.service;

import com.abroad.payment.domain.PaymentStatus;
import com.abroad.payment.repository.PaymentRepository;
import com.abroad.payment.web.dto.CourseAccessResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
    private final ObjectMapper objectMapper;
    private final String contentServiceBaseUrl;
    private final byte[] webhookSecretBytes;

    public CourseAccessService(
            RestTemplate restTemplate,
            PaymentRepository paymentRepository,
            ObjectMapper objectMapper,
            @Value("${app.content-service.url:http://content-service:3000}") String contentServiceBaseUrl,
            @Value("${app.webhook.secret}") String webhookSecretValue) {
        this.restTemplate = restTemplate;
        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
        this.contentServiceBaseUrl = contentServiceBaseUrl.replaceAll("/$", "");
        this.webhookSecretBytes = webhookSecretValue.getBytes(StandardCharsets.UTF_8);
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
            boolean hasAccess = data.path("hasAccess").asBoolean(false);
            boolean paidLocally =
                    userId != null
                            && !userId.isBlank()
                            && paymentRepository.existsByUserIdAndCourseIdAndStatus(
                                    userId, courseId, PaymentStatus.COMPLETED);
            if (paidLocally && !hasAccess) {
                hasAccess = true;
            }
            return new CourseAccessResponse(
                    UUID.fromString(data.path("courseId").asText(courseId.toString())),
                    data.path("title").asText(null),
                    new BigDecimal(data.path("price").asText("0")),
                    data.path("isFree").asBoolean(false),
                    hasAccess || data.path("isFree").asBoolean(false),
                    data.path("enrolled").asBoolean(false),
                    data.path("paid").asBoolean(false) || paidLocally,
                    data.path("requiresLogin").asBoolean(userId == null || userId.isBlank()));
        } catch (Exception e) {
            throw new IllegalStateException("Không thể kiểm tra quyền truy cập khóa học", e);
        }
    }
}
