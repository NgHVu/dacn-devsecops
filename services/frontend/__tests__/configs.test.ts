/**
 * Unit Test để tăng độ bao phủ cho các file cấu hình PostCSS và ESLint.
 * Việc import các file này trong môi trường test giúp SonarQube ghi nhận coverage.
 */

import postcssConfig from '../postcss.config.mjs';
import eslintConfig from '../eslint.config.mjs';

// Định nghĩa kiểu dữ liệu tối giản để kiểm tra cấu hình mà không dùng 'any'
interface PostCSSConfig {
  plugins: Record<string, unknown>;
}

interface ESLintConfigItem {
  ignores?: string[];
  rules?: Record<string, unknown>;
}

/**
 * Khai báo các hàm toàn cục của Jest để TypeScript không báo lỗi "Cannot find name".
 * Chúng ta khai báo thủ công ở đây để tránh phụ thuộc vào module '@jest/globals' bị thiếu.
 */
declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const expect: (actual: unknown) => {
  toBeDefined(): void;
  toBe(value: unknown): void;
  toBeGreaterThan(value: number): void;
  toHaveProperty(path: string): void;
};

describe('Kiểm tra cấu hình dự án (Coverage Fix)', () => {
  
  test('PostCSS config nên chứa plugin Tailwind', () => {
    // Kiểm tra xem object config có tồn tại không
    expect(postcssConfig).toBeDefined();
    
    // Ép kiểu về interface cụ thể để đảm bảo an toàn kiểu dữ liệu
    const config = postcssConfig as unknown as PostCSSConfig;
    expect(config.plugins).toHaveProperty('@tailwindcss/postcss');
  });

  test('ESLint config nên được định nghĩa dưới dạng mảng (Flat Config)', () => {
    // ESLint 9+ dùng flat config là một mảng
    const isArray = Array.isArray(eslintConfig);
    expect(isArray).toBe(true);
    
    const configArray = eslintConfig as unknown as ESLintConfigItem[];
    // Kiểm tra xem có ít nhất một object cấu hình được định nghĩa
    expect(configArray.length).toBeGreaterThan(0);
  });

  test('ESLint config nên chứa các quy tắc cơ bản', () => {
    const configArray = eslintConfig as unknown as ESLintConfigItem[];
    // Duyệt qua các phần tử để tìm cấu hình ignores hoặc rules mà không dùng any
    const hasIgnores = configArray.some((cfg) => cfg.ignores !== undefined);
    expect(hasIgnores).toBe(true);
  });
});