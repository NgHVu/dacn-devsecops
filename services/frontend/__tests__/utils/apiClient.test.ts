/* eslint-disable @typescript-eslint/no-require-imports */
import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

/**
 * Định nghĩa cấu trúc Mock để TypeScript hiểu
 */
interface MockAxiosInstance {
    interceptors: {
        request: { use: jest.Mock; eject: jest.Mock };
        response: { use: jest.Mock; eject: jest.Mock };
    };
    defaults: { headers: { common: Record<string, string> } };
    post: jest.Mock;
    get: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
    patch: jest.Mock;
}

// Biến toàn cục để hứng instance của axios mock, giúp verify bên trong test
let mockAxiosCreate: jest.Mock;
let mockAxiosInstance: MockAxiosInstance;

// Helper để tạo mock axios mới cho mỗi test case
const setupAxiosMock = () => {
    const mockInterceptors = {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
    };
    const mockInstance = {
        interceptors: mockInterceptors,
        defaults: { headers: { common: {} } },
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    };
    
    mockAxiosInstance = mockInstance as unknown as MockAxiosInstance;
    mockAxiosCreate = jest.fn(() => mockInstance);

    return {
        create: mockAxiosCreate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isAxiosError: jest.fn((payload: any) => payload?.isAxiosError === true),
        ...mockInstance
    };
};

/**
 * Định nghĩa expect mở rộng để hỗ trợ các helper matchers nếu types mặc định bị thiếu.
 * Chúng ta sử dụng type casting (as) thay vì 'declare' để tránh xung đột với lệnh import.
 */
interface ExtendedExpect {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (actual: unknown): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stringContaining(str: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  anything(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectContaining(obj: any): any;
}

const customExpect = (expect as unknown) as ExtendedExpect;

// Định nghĩa kiểu cho các interceptor callbacks để tránh lỗi 'unknown'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InterceptorCallback = (...args: any[]) => any;

describe("apiClient Coverage Tests", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let originalWindow: any;
    let originalEnv: NodeJS.ProcessEnv;

    beforeAll(() => {
        originalWindow = global.window;
        originalEnv = process.env;
    });

    afterAll(() => {
        global.window = originalWindow;
        process.env = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules(); // Xóa cache module để nạp lại apiClient.ts từ đầu
        process.env = { ...originalEnv };
        global.window = originalWindow;
        
        // Thiết lập lại mock axios cho mỗi test
        jest.doMock("axios", setupAxiosMock);
    });

    // --- TEST GROUP 1: getBaseUrl Logic (Vá các dòng 3-9) ---

    test("getBaseUrl: trả về '/' khi chạy ở Client Side (window defined)", () => {
        // Đảm bảo window tồn tại
        global.window = {} as Window & typeof globalThis;
        
        // Re-import để chạy lại logic getBaseUrl()
        require("@/lib/apiClient");
        
        expect(mockAxiosCreate).toHaveBeenCalledWith(customExpect.objectContaining({
            baseURL: "/"
        }));
    });

    test("getBaseUrl: trả về ENV VAR khi chạy ở Server Side (window undefined)", () => {
        // Xóa window để giả lập Server
        // @ts-expect-error: Deleting global window for test purpose
        delete global.window;
        process.env.NEXT_PUBLIC_APP_URL = "http://custom-domain.com";

        require("@/lib/apiClient");

        expect(mockAxiosCreate).toHaveBeenCalledWith(customExpect.objectContaining({
            baseURL: "http://custom-domain.com"
        }));
    });

    test("getBaseUrl: trả về localhost mặc định khi thiếu ENV và chạy Server Side", () => {
        // @ts-expect-error: Deleting global window for test purpose
        delete global.window;
        delete process.env.NEXT_PUBLIC_APP_URL;

        require("@/lib/apiClient");

        expect(mockAxiosCreate).toHaveBeenCalledWith(customExpect.objectContaining({
            baseURL: "http://localhost:3000"
        }));
    });

    // --- TEST GROUP 2: Request Interceptors (Vá các dòng 18-32) ---

    test("Request Interceptor: thêm Bearer token nếu có trong localStorage", () => {
        // Mock localStorage
        const mockGetItem = jest.fn().mockReturnValue("test-token");
        Object.defineProperty(global, 'localStorage', {
            value: { getItem: mockGetItem },
            writable: true,
            configurable: true
        });

        // Trigger import để đăng ký interceptor
        require("@/lib/apiClient");

        // Lấy success callback từ mock và ép kiểu để tránh lỗi 'unknown'
        const successCallback = mockAxiosInstance.interceptors.request.use.mock.calls[0][0] as InterceptorCallback;

        // Giả lập config object
        const config = { headers: {} };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = successCallback(config as any);

        expect(result.headers.Authorization).toBe("Bearer test-token");
    });

    test("Request Interceptor: xóa header X-Skip-Auth và return sớm", () => {
        require("@/lib/apiClient");

        const successCallback = mockAxiosInstance.interceptors.request.use.mock.calls[0][0] as InterceptorCallback;
        
        // Config có X-Skip-Auth
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = { headers: { 'X-Skip-Auth': 'true', 'Authorization': 'Old' } } as any;
        const result = successCallback(config);

        // Header phải bị xóa
        expect(result.headers['X-Skip-Auth']).toBeUndefined();
        // Authorization không bị ghi đè (vì return sớm)
        expect(result.headers.Authorization).toBe("Old");
    });
    
    test("Request Interceptor Error: trả về Promise reject (Vá dòng 32)", async () => {
        require("@/lib/apiClient");

        const errorCallback = mockAxiosInstance.interceptors.request.use.mock.calls[0][1] as InterceptorCallback;
        const error = new Error("Test Error");
        
        await expect(errorCallback(error)).rejects.toBe(error);
    });

    // --- TEST GROUP 3: Response Interceptors (Vá các dòng 37-52) ---

    test("Response Interceptor: trả về response khi thành công", () => {
        require("@/lib/apiClient");
        const successCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][0] as InterceptorCallback;
        
        const response = { data: "success" };
        expect(successCallback(response)).toBe(response);
    });

    test("Response Interceptor Error: Log lỗi Axios đầy đủ ở Client Side", async () => {
        global.window = {} as Window & typeof globalThis;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        require("@/lib/apiClient");
        const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1] as InterceptorCallback;

        const axiosError = {
            isAxiosError: true,
            config: { method: 'GET', url: '/api/test' },
            response: { status: 400, data: { msg: 'bad' } },
            message: 'Fail'
        };

        try {
            await errorCallback(axiosError);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Expected reject
        }

        expect(consoleSpy).toHaveBeenCalledWith(
            customExpect.stringContaining("LỖI API [GET /api/test] (Status: 400):"), 
            { msg: 'bad' }
        );
        
        consoleSpy.mockRestore();
    });

    test("Response Interceptor Error: Log lỗi không xác định ở Client Side (Vá dòng 46)", async () => {
        global.window = {} as Window & typeof globalThis;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        require("@/lib/apiClient");
        const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1] as InterceptorCallback;

        const genericError = new Error("Boom");
        // Giả lập isAxiosError trả về false

        try {
            await errorCallback(genericError);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}

        expect(consoleSpy).toHaveBeenCalledWith("Lỗi không xác định:", genericError);
        consoleSpy.mockRestore();
    });

    test("Response Interceptor Error: KHÔNG log lỗi ở Server Side (Vá dòng 38)", async () => {
        // @ts-expect-error: Deleting global window for test purpose
        delete global.window;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        require("@/lib/apiClient");
        const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1] as InterceptorCallback;

        try {
            await errorCallback({ isAxiosError: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});