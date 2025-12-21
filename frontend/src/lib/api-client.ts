import { api } from "./api";

// Wrapper around the existing api instance to match the time-management API expectations
export const apiClient = {
  get: <T = any>(url: string, config?: any) => {
    return api.get<T>(url, config);
  },
  post: <T = any>(url: string, data?: any, config?: any) => {
    return api.post<T>(url, data, config);
  },
  patch: <T = any>(url: string, data?: any, config?: any) => {
    return api.patch<T>(url, data, config);
  },
  delete: <T = any>(url: string, config?: any) => {
    return api.delete<T>(url, config);
  },
  put: <T = any>(url: string, data?: any, config?: any) => {
    return api.put<T>(url, data, config);
  },
};

