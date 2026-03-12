import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X, LogOut } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useAuth } from "@/lib/hooks/auth/useAuth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classes", label: "My Classes" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-10">
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-primary bg-primary/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-xl font-bold tracking-tight">
                Olùkọ́
              </h2>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-800">
              <Avatar
                src={user?.profilePicture}
                alt={user?.fullName || "User"}
                size="sm"
                className="cursor-pointer"
              />
              <button
                onClick={logout}
                className="p-2 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-primary bg-primary/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-xl font-bold tracking-tight">
                Olùkọ́
              </h2>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 space-y-6">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.profilePicture}
                alt={user?.fullName || "User"}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || "Loading..."}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
