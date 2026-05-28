package com.abroad.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.vnpay")
public class VnpayProperties {

    private String tmnCode = "";
    private String hashSecret = "";
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    /** URL backend nhận redirect từ VNPay (trình duyệt user). */
    private String returnUrl = "";
    /** URL backend IPN (VNPay gọi server-to-server; localhost không nhận được trừ khi tunnel). */
    private String ipnUrl = "";
    /** Sau khi xử lý return, chuyển user về frontend. */
    private String frontendRedirectBase = "http://localhost:5173/payment";

    public String getTmnCode() {
        return tmnCode;
    }

    public void setTmnCode(String tmnCode) {
        this.tmnCode = tmnCode == null ? null : tmnCode.trim();
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret == null ? null : hashSecret.trim();
    }

    public String getPayUrl() {
        return payUrl;
    }

    public void setPayUrl(String payUrl) {
        this.payUrl = payUrl == null ? null : payUrl.trim();
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl == null ? null : returnUrl.trim();
    }

    public String getIpnUrl() {
        return ipnUrl;
    }

    public void setIpnUrl(String ipnUrl) {
        this.ipnUrl = ipnUrl == null ? null : ipnUrl.trim();
    }

    public String getFrontendRedirectBase() {
        return frontendRedirectBase;
    }

    public void setFrontendRedirectBase(String frontendRedirectBase) {
        this.frontendRedirectBase = frontendRedirectBase == null ? null : frontendRedirectBase.trim();
    }

    public boolean isConfigured() {
        return tmnCode != null
                && !tmnCode.isBlank()
                && hashSecret != null
                && !hashSecret.isBlank()
                && returnUrl != null
                && !returnUrl.isBlank();
    }
}
