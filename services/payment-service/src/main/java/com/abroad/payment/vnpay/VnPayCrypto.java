package com.abroad.payment.vnpay;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Theo hướng dẫn VNPay: sắp xếp key, hashData = key=encode(value) nối &, HMAC-SHA512 (hex). */
public final class VnPayCrypto {

    private VnPayCrypto() {}

    public static String hmacSha512Hex(String secretKey, String signData) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        byte[] raw = mac.doFinal(signData.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(raw.length * 2);
        for (byte b : raw) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public static String encodeVnpValue(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    /** Build hashData và query string (chưa gồm vnp_SecureHash). */
    public static BuildResult buildSignedQuery(Map<String, String> params) {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        int n = 0;
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            String key = e.getKey();
            String val = e.getValue();
            if (val == null || val.isEmpty()) {
                continue;
            }
            if (n++ > 0) {
                hashData.append('&');
                query.append('&');
            }
            hashData.append(key).append('=').append(encodeVnpValue(val));
            query.append(encodeVnpValue(key)).append('=').append(encodeVnpValue(val));
        }
        return new BuildResult(hashData.toString(), query.toString());
    }

    public record BuildResult(String hashData, String queryWithoutHash) {}
}
