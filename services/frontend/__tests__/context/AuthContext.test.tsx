// __tests__/context/AuthContext.test.tsx
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";

// Mock apiClient
jest.mock("@/lib/apiClient", () => ({
  get: jest.fn(),
}));
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

/**
 * Mock lucide-react
 * Lưu ý: trong test này ta KHÔNG assert spinner “tồn tại ngay lập tức”
 * vì useEffect có thể set isLoading=false rất nhanh => spinner biến mất trước khi assert.
 * Ta chỉ cần assert trạng thái cuối cùng đúng.
 */
jest.mock("lucide-react", () => ({
  Loader2: ({ className }: { className: string }) => (
    <div data-testid="loading-spinner" className={className}>
      Loading...
    </div>
  ),
}));

const TestComponent = () => {
  const { user, isAuthenticated, login, logout, refreshProfile } = useAuth();
  return (
    <div>
      <div data-testid="user-email">{user?.email || "no-user"}</div>
      <div data-testid="auth-status">{isAuthenticated ? "authenticated" : "guest"}</div>
      <button onClick={() => login("fake-token")} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={refreshProfile} data-testid="refresh-btn">
        Refresh
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  const mockUser = { id: 1, email: "test@example.com", name: "Test User" };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("nên chuyển sang trạng thái khách nếu không có token", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Không kiểm tra spinner nữa (nó có thể biến mất trước khi kịp assert)
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
      expect(screen.getByTestId("user-email")).toHaveTextContent("no-user");
    });

    // Với case không token thì không gọi API
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  test("nên tự động đăng nhập nếu có token hợp lệ trong localStorage", async () => {
    localStorage.setItem("authToken", "valid-token");
    mockedApiClient.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/users/me");
  });

  test("hàm login: nên lưu token vào localStorage và lấy thông tin user", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
    });

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    expect(localStorage.getItem("authToken")).toBe("fake-token");

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });
  });

  test("hàm logout: nên xóa sạch thông tin user và token trong storage", async () => {
    localStorage.setItem("authToken", "token-to-delete");
    mockedApiClient.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });

    act(() => {
      screen.getByTestId("logout-btn").click();
    });

    expect(localStorage.getItem("authToken")).toBeNull();
    expect(screen.getByTestId("user-email")).toHaveTextContent("no-user");
    expect(screen.getByTestId("auth-status")).toHaveTextContent("guest");
  });

  test("hàm refreshProfile: nên gọi lại API lấy thông tin mới nhất nếu đang có session", async () => {
    localStorage.setItem("authToken", "active-token");
    mockedApiClient.get
      .mockResolvedValueOnce({ data: mockUser }) // init
      .mockResolvedValueOnce({ data: { ...mockUser, name: "Updated User" } }); // refresh

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    });

    await act(async () => {
      screen.getByTestId("refresh-btn").click();
    });

    expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(1, "/api/users/me");
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(2, "/api/users/me");
  });
});
