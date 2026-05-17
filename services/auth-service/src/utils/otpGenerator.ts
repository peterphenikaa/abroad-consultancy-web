import crypto from 'crypto';

export class OtpGenerator {
  /**
   * Gennerate a random OTP
   * @param length Length of the OTP (default is 6)
   * @returns A random OTP string
   */
  static generateOTP(length: number = 6): string {
    // crate a random number from 0 -> (10^length -1)
    const max = Math.pow(10, length);
    const otpNumber = crypto.randomInt(0, max);

    // casting to string and add 0 padding to the left if the number is shorter than the desired length
    return otpNumber.toString().padStart(length, '0');
  }

  /**
   * Validate the input fomart of the OTP (should be a string of digits with the specified length)
   */
  static validateOTPFormat(otp: string, length: number = 6): boolean {
    if (!otp) return false;

    const regex = new RegExp(`^\\d{${length}}$`);
    return regex.test(otp);
  }
}
