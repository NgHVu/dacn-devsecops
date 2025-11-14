import axios from "axios";

const apiClient = axios.create({
  baseURL: "/", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Gửi Request (Tự động đính kèm token)
apiClient.interceptors.request.use(
  (config) => {
    if (config.headers['X-Skip-Auth']) {
      delete config.headers['X-Skip-Auth'];
      return config;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Nhận Response (Gom log lỗi về 1 chỗ)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`LỖI API [${method} ${url}] (Status: ${status}):`, data || error.message);
    } else {
      console.error("Lỗi không xác định:", error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;