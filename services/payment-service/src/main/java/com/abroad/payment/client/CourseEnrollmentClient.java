package com.abroad.payment.client;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class CourseEnrollmentClient {

    private final RestTemplate restTemplate;
    private final String contentServiceBaseUrl;
    private final byte[] webhookSecretBytes;

    public CourseEnrollmentClient(
            RestTemplate restTemplate,
            @Value("${app.content-service.url:http://content-service:3000}") String contentServiceBaseUrl,
            @Value("${app.webhook.secret}") String webhookSecretValue) {
        this.restTemplate = restTemplate;
        this.contentServiceBaseUrl = contentServiceBaseUrl.replaceAll("/$", "");
        this.webhookSecretBytes = webhookSecretValue.getBytes(StandardCharsets.UTF_8);
    }

    public void enrollAfterPayment(String userId, UUID courseId) {
        if (userId == null || userId.isBlank() || courseId == null) {
            return;
        }
        String url =
                contentServiceBaseUrl
                        + "/api/v1/courses/"
                        + courseId
                        + "/enroll-from-payment";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Payment-Webhook-Secret", new String(webhookSecretBytes, StandardCharsets.UTF_8));
        HttpEntity<Map<String, String>> entity =
                new HttpEntity<>(Map.of("userId", userId), headers);
        try {
            restTemplate.postForEntity(url, entity, Map.class);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Không thể ghi danh khóa học sau thanh toán", ex);
        }
    }
}
