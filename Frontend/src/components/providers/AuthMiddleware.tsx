import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Auth Middleware Component
 * This component acts as a client-side middleware to protect routes and ensure auth state validity.
 * It checks for the auth token on every route change and window focus.
 */
export function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isChecking, logout, checkAuth } =
    useAuthStore();

  useEffect(() => {
    const verifyAuth = () => {
      const token = Cookies.get("auth_token");

      if (isAuthenticated && !token) {
        logout();
        return;
      }

      if (token && (!isAuthenticated || !user) && !isChecking) {
        checkAuth();
      }
    };

    verifyAuth();

    window.addEventListener("focus", verifyAuth);
    window.addEventListener("storage", verifyAuth);

    return () => {
      window.removeEventListener("focus", verifyAuth);
      window.removeEventListener("storage", verifyAuth);
    };
  }, [user, isAuthenticated, isChecking, logout, checkAuth]);

  return <>{children}</>;
}
