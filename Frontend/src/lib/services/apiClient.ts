import axios from "axios";
import Cookies from "js-cookie";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setupInterceptors = (logout: () => void) => {
  apiClient.interceptors.response.use(
    (response) => response,
    (error: any) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      return Promise.reject(error.response?.data || error.message);
    },
  );
};

export default apiClient;
