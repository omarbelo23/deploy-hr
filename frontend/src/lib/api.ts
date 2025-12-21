import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000",
  withCredentials: true, // send/receive cookies
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include token on every request
api.interceptors.request.use(
  (config) => {
    // Get the latest token from localStorage on every request
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {} as any;
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Remove Authorization header if no token
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      // Network error - backend might be down or unreachable
      console.error("Network error:", error.message);
      // Don't redirect on network errors, let components handle it
      return Promise.reject(error);
    }

    if (error.response) {
      const status = error.response.status;
      // Handle 401 Unauthorized - token invalid or expired
      if (status === 401 && typeof window !== "undefined") {
        // Clear auth data
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      // 403 Forbidden - user doesn't have permission (don't redirect, let the component handle it)
    }
    return Promise.reject(error);
  }
);

// If there's a token in localStorage, use it on initial load (fallback)
if (typeof window !== "undefined") {
  const token = localStorage.getItem("access_token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export { api };
export default api;