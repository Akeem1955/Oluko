import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { useAuthStore } from "@/lib/store/authStore";
import { publicRoutes, protectedRoutes, notFoundRoute } from "@/config/routes";

import { GraduationCap } from "lucide-react";

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-night transition-colors duration-500 relative overflow-hidden">
      {/* Subtle ambient light for premium feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col items-center">
        {/* Premium Glassmorphic Logo Container */}
        <div className="w-16 h-16 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex items-center justify-center mb-6 animate-float relative overflow-hidden group">
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <GraduationCap className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
        </div>

        {/* High-End Branding */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase animate-fade-in relative">
          <span className="opacity-80">Olùkọ́</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary/40 rounded-full" />
        </h2>
      </div>
    </div>
  );
}

/**
 * Private route wrapper component
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

/**
 * Redirects authenticated users to dashboard
 */
function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import { AuthMiddleware } from "@/components/providers/AuthMiddleware";

/**
 * Main App component
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <AuthMiddleware>
            <Routes>
              {/* Public routes */}
              {publicRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    route.guestOnly ? (
                      <RedirectIfAuthenticated>
                        {route.element}
                      </RedirectIfAuthenticated>
                    ) : (
                      route.element
                    )
                  }
                />
              ))}

              {/* Protected routes */}
              {protectedRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<PrivateRoute>{route.element}</PrivateRoute>}
                />
              ))}

              {/* 404 Not Found */}
              <Route
                path={notFoundRoute.path}
                element={notFoundRoute.element}
              />
            </Routes>
          </AuthMiddleware>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
