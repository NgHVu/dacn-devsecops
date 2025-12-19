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
  files?: string[];
}

/**
 * Khai báo các hàm toàn cục của Jest. 
 * Khi chạy local với npm test, Jest sẽ tự động cung cấp các hàm này.
 */
declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const expect: (actual: unknown) => {
  toBeDefined(): void;
  toBe(value: unknown): void;
  toBeGreaterThan(value: number): void;
  toHaveProperty(path: string): void;
  toContain(value: unknown): void;
  toBeTruthy(): void;
};

describe('Kiểm tra cấu hình dự án (Coverage Fix)', () => {
  
  test('PostCSS config nên chứa plugin Tailwind v4', () => {
    // Kiểm tra xem object config có tồn tại không
    expect(postcssConfig).toBeDefined();
    
    // Ép kiểu để kiểm tra sâu vào thuộc tính, giúp tăng coverage cho object literal
    const config = postcssConfig as unknown as PostCSSConfig;
    
    // Kiểm tra sự tồn tại của plugin Tailwind PostCSS mới
    expect(config.plugins).toHaveProperty('@tailwindcss/postcss');
    expect(config.plugins['@tailwindcss/postcss']).toBeDefined();
  });

  test('ESLint config nên được định nghĩa chuẩn (Flat Config)', () => {
    // ESLint 9+ dùng flat config là một mảng
    const isArray = Array.isArray(eslintConfig);
    expect(isArray).toBe(true);
    
    const configArray = eslintConfig as unknown as ESLintConfigItem[];
    // Kiểm tra xem có ít nhất một object cấu hình được định nghĩa
    expect(configArray.length).toBeGreaterThan(0);
  });

  test('ESLint config nên chứa đầy đủ các đường dẫn ignores', () => {
    const configArray = eslintConfig as unknown as ESLintConfigItem[];
    
    // Tìm phần tử cấu hình ignores để kiểm tra chi tiết
    const ignoreConfig = configArray.find((cfg) => cfg.ignores !== undefined);
    expect(ignoreConfig).toBeDefined();
    
    if (ignoreConfig && ignoreConfig.ignores) {
      // Kiểm tra từng đường dẫn để đảm bảo logic mapping trong eslint.config.mjs được thực thi
      const pathsToVerify = ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'];
      pathsToVerify.forEach(path => {
        expect(ignoreConfig.ignores).toContain(path);
      });
    }
  });

  test('ESLint config nên tích hợp cấu hình Next.js và TypeScript', () => {
    const configArray = eslintConfig as unknown as ESLintConfigItem[];
    // eslint-config-next thường tạo ra nhiều object trong mảng cấu hình
    expect(configArray.length).toBeGreaterThan(2);
    
    // Đảm bảo có ít nhất một cấu hình có chứa rules hoặc định nghĩa files
    const hasLogicConfig = configArray.some(cfg => cfg.rules !== undefined || cfg.files !== undefined);
    expect(hasLogicConfig).toBeTruthy();
  });
});