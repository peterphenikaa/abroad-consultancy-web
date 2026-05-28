package com.abroad.payment.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public String root() {
        return "payment-service: ok";
    }

    @GetMapping("/healthz")
    public String healthz() {
        return "ok";
    }
}
