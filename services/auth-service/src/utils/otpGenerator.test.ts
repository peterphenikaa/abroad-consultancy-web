// src/utils/otpGenerator.test.ts
import { OtpGenerator } from './otpGenerator';
import { describe, it, expect } from '@jest/globals';

describe('OtpGenerator', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP by default', () => {
      const otp = OtpGenerator.generateOTP();
      expect(typeof otp).toBe('string');
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate OTP of specified length', () => {
      const otp = OtpGenerator.generateOTP(4);
      expect(otp).toHaveLength(4);
      expect(otp).toMatch(/^\d{4}$/);
    });
  });

  describe('validateOTPFormat', () => {
    it('should return true for valid 6-digit OTP', () => {
      expect(OtpGenerator.validateOTPFormat('123456')).toBe(true);
      expect(OtpGenerator.validateOTPFormat('000000')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(OtpGenerator.validateOTPFormat('12345')).toBe(false); // Ngắn hơn
      expect(OtpGenerator.validateOTPFormat('1234567')).toBe(false); // Dài hơn
      expect(OtpGenerator.validateOTPFormat('123a56')).toBe(false); // Có chữ
      expect(OtpGenerator.validateOTPFormat('')).toBe(false); // Rỗng
    });
  });
});
