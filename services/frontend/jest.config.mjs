import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Đường dẫn đến ứng dụng Next.js để load next.config.js và .env
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  // Đảm bảo hỗ trợ môi trường trình duyệt cho React components
  testEnvironment: 'jest-environment-jsdom',
  
  // Thiết lập setupFiles sau khi môi trường test được khởi tạo
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Cấu hình module mapping cho các alias (như @/...)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Thu thập độ bao phủ code
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  
  // Định dạng các loại file báo cáo
  coverageReporters: ['text', 'lcov', 'clover'],

  // Chỉ định các file cần thu thập coverage
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx,mjs}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    // Đảm bảo bao gồm các file config bạn muốn test
    'postcss.config.mjs',
    'eslint.config.mjs'
  ],
};

export default createJestConfig(config);