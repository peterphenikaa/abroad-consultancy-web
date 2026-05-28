package com.abroad.payment;

import com.abroad.payment.config.BillingProperties;
import com.abroad.payment.config.PaymentProperties;
import com.abroad.payment.config.VnpayProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({VnpayProperties.class, BillingProperties.class, PaymentProperties.class})
@org.springframework.scheduling.annotation.EnableScheduling
public class PaymentApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentApplication.class, args);
    }
}
