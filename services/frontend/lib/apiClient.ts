import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USERS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// *** THÊM KHỐI INTERCEPTOR NÀY VÀO ***
apiClient.interceptors.request.use(
  (config) => {
    // Chỉ chạy ở client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;