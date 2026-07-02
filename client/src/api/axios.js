// VERIFIED: api/axios.js — security interceptors added
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// SECURITY: Request interceptor — attaches JWT token and strips script tags from all string fields
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("linksphereai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // SECURITY: Client-side XSS sanitization — remove script tags from all outgoing string values
    // (Server-side xss-clean is the primary guard; this is defence-in-depth)
    if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
      const sanitize = (obj) => {
        Object.keys(obj).forEach((key) => {
          if (typeof obj[key] === "string") {
            obj[key] = obj[key]
              .replace(/<script[^>]*>.*?<\/script>/gis, "")
              .replace(/javascript:/gi, "");
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            sanitize(obj[key]);
          }
        });
      };
      sanitize(config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// SECURITY: Response interceptor — auto-logout on 401 (token expired/blacklisted)
// This ensures a stolen or invalidated token can't keep a session alive on the client
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRoute =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");

      // SECURITY: Only auto-redirect on 401 from protected routes, not from login failures
      if (!isLoginRoute) {
        localStorage.removeItem("linksphereai_token");
        localStorage.removeItem("linksphereai_user");
        // Redirect to login — use replace so back button doesn't return to protected page
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
