import request from 'supertest';
import app from '../../app'; // Đảm bảo đường dẫn này trỏ tới file export app của bạn
import { prismaClient } from '../../lib/prisma'; // Dùng đúng tên prismaClient
import { redisClient } from '../../lib/redis'; // Dùng đúng đường dẫn Redis của bạn
import { OtpType } from '../../constants/otpTypes';

describe('Luồng Xác thực Email (Email Verification Flow)', () => {
  const testEmail = 'test-verify-flow@cambridge.com';
  const testPassword = 'Password123!@#';
  const testFullName = 'Integration Test User';

  // Chạy TRƯỚC KHI bắt đầu test suite: Dọn dẹp data cũ nếu có
  beforeAll(async () => {
    await prismaClient.user.deleteMany({ where: { email: testEmail } });
    await redisClient.del(`otp:${OtpType.EMAIL_VERIFY}:${testEmail}`); // Sửa lại key format nếu hàm saveOTP của bạn sinh ra key khác
  });

  // Chạy SAU KHI hoàn thành toàn bộ test: Dọn dẹp rác và ngắt kết nối
  afterAll(async () => {
    await prismaClient.user.deleteMany({ where: { email: testEmail } });
    await redisClient.del(`otp:${OtpType.EMAIL_VERIFY}:${testEmail}`);

    // Ngắt kết nối để Jest có thể tự động thoát (exit) một cách duyên dáng
    await prismaClient.$disconnect();
    await redisClient.quit();
  });

  it('Step 1: Nên đăng ký thành công, tạo Profile rỗng và sinh mã OTP trong Redis', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      fullName: testFullName,
    });

    // 1. Kiểm tra API Response
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.emailVerified).toBe(false);

    // 2. Kiểm tra DB xem Profile có được tạo không
    const dbUser = await prismaClient.user.findUnique({
      where: { email: testEmail },
      include: { userProfile: true }, // Kiểm tra quan hệ 1-1
    });
    expect(dbUser?.userProfile).not.toBeNull();

    // 3. Kiểm tra Redis xem OTP có được lưu không
    const otpInRedis = await redisClient.get(`otp:${OtpType.EMAIL_VERIFY}:${testEmail}`);
    expect(otpInRedis).toBeTruthy();
    expect(otpInRedis?.length).toBe(6);
  });

  it('Step 2: Nên báo lỗi khi nhập sai mã OTP', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({
      email: testEmail,
      otp: '000000', // Mã OTP cố tình nhập sai
    });

    expect(res.status).toBe(400);
    // Nếu bạn config ApiError thì code trả về sẽ có format cụ thể. Ví dụ:
    // expect(res.body.errorCode).toBe('INVALID_OTP');
  });

  it('Step 3: Nên xác thực thành công khi nhập đúng mã OTP', async () => {
    // Hack trong test: Lấy mã OTP thật từ Redis ra để giả lập user check email
    const correctOtp = await redisClient.get(`otp:${OtpType.EMAIL_VERIFY}:${testEmail}`);

    const res = await request(app).post('/api/auth/verify-email').send({
      email: testEmail,
      otp: correctOtp,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('thành công');

    // Kiểm tra DB xem cờ emailVerified đã được bật chưa
    const updatedUser = await prismaClient.user.findUnique({
      where: { email: testEmail },
      select: { emailVerified: true, emailVerifiedAt: true },
    });

    expect(updatedUser?.emailVerified).toBe(true);
    expect(updatedUser?.emailVerifiedAt).not.toBeNull();
  });

  it('Step 4: Nên báo lỗi nếu cố tình verify lại một email đã verify rồi', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({
      email: testEmail,
      otp: '123456', // Dù nhập đúng/sai thì đều phải văng lỗi ALREADY_VERIFIED trước
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('đã được xác thực');
  });
});
