export enum OtpType {
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  PHONE_VERIFY = 'PHONE_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FA_SMS = '2FA_SMS',
}

export const OTP_TTL = {
  [OtpType.EMAIL_VERIFY]: 10 * 60, // 10 phút
  [OtpType.PHONE_VERIFY]: 5 * 60, // 5 phút
  [OtpType.PASSWORD_RESET]: 15 * 60, // 15 phút
  [OtpType.TWO_FA_SMS]: 5 * 60, // 5 phút
};
