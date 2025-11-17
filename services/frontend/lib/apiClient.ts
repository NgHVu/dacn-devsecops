import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {

    return "/";
  }
  
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (axios.isAxiosError(error)) {
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        const status = error.response?.status;
        const data = error.response?.data;
        console.error(`LỖI API [${method} ${url}] (Status: ${status}):`, data || error.message);
      } else {
        console.error("Lỗi không xác định:", error);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;