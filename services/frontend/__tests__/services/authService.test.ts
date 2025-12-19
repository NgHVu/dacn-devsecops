import apiClient from "@/lib/apiClient";
import { authService } from "@/services/authService";

// Mock apiClient để không gọi API thật
jest.mock("@/lib/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("authService", () => {
  const mockAuthResponse = { accessToken: "fake-jwt-token" };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Login & Register ---
  test("login: nên gọi đúng endpoint và trả về token", async () => {
    const loginData = { email: "test@example.com", password: "password123" };
    mockedApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

    const result = await authService.login(loginData);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/auth/login", loginData);
    expect(result).toEqual(mockAuthResponse);
  });

  test("register: nên gọi endpoint đăng ký và trả về thông báo", async () => {
    const regData = { name: "User", email: "test@test.com", password: "123" };
    mockedApiClient.post.mockResolvedValueOnce({ data: "OTP Sent" });

    const result = await authService.register(regData);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/auth/register", regData);
    expect(result).toBe("OTP Sent");
  });

  // --- 2. Verification & OTP ---
  test("verifyAccount: nên gọi đúng endpoint với OTP", async () => {
    const verifyData = { email: "test@test.com", otp: "123456" };
    mockedApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

    const result = await authService.verifyAccount(verifyData);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/auth/verify", verifyData);
    expect(result).toEqual(mockAuthResponse);
  });

  test("resendOtp: nên gửi lại mã OTP cho email", async () => {
    const email = "test@test.com";
    mockedApiClient.post.mockResolvedValueOnce({ data: "Resent" });

    const result = await authService.resendOtp(email);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/api/auth/resend-otp", { email });
    expect(result).toBe("Resent");
  });

  // --- 3. Google OAuth ---
  test("loginWithGoogle: nên truyền header X-Skip-Auth", async () => {
    const googleData = { code: "google-code-123" };
    mockedApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

    await authService.loginWithGoogle(googleData);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/auth/oauth/google",
      googleData,
      expect.objectContaining({
        headers: { "X-Skip-Auth": "true" }
      })
    );
  });

  // --- 4. Password Recovery (Vá các dòng missed 49-85) ---
  test("forgotPassword: nên gọi API quên mật khẩu với header X-Skip-Auth", async () => {
    const forgotData = { email: "test@test.com" };
    mockedApiClient.post.mockResolvedValueOnce({ data: "Email sent" });

    const result = await authService.forgotPassword(forgotData);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/auth/forgot-password',
      forgotData,
      expect.objectContaining({
        headers: { 'X-Skip-Auth': 'true' }
      })
    );
    expect(result).toBe("Email sent");
  });

  test("validateResetToken: nên gọi GET với token được encode", async () => {
    const token = "token 123"; // chứa dấu cách để test encode
    mockedApiClient.get.mockResolvedValueOnce({});

    await authService.validateResetToken(token);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
      expect.objectContaining({
        headers: { 'X-Skip-Auth': 'true' }
      })
    );
  });

  test("resetPassword: nên cập nhật mật khẩu mới", async () => {
    const resetData = { token: "token123", newPassword: "newPassword123" };
    mockedApiClient.post.mockResolvedValueOnce({ data: "Success" });

    const result = await authService.resetPassword(resetData);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/auth/reset-password',
      resetData,
      expect.objectContaining({
        headers: { 'X-Skip-Auth': 'true' }
      })
    );
    expect(result).toBe("Success");
  });
});