import axios from "axios";

/**
 * Tạo một axios instance được cấu hình sẵn cho
 * việc gọi API đến users-service.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USERS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * BƯỚC NÂNG CAO (CHO TƯƠNG LAI):
 * Chúng ta sẽ thêm "interceptors" (bộ đánh chặn) ở đây.
 * Interceptor sẽ tự động lấy token từ localStorage
 * và gắn vào header "Authorization" cho MỌI request.
 *
 * apiClient.interceptors.request.use( (config) => {
 * const token = localStorage.getItem('authToken');
 * if (token) {
 * config.headers.Authorization = `Bearer ${token}`;
 * }
 * return config;
 * });
 */

export default apiClient;