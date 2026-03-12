import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils/utils";
import { useAuthStore } from "@/lib/store/authStore";

interface LandingHeaderProps {
  scrolled: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export const LandingHeader = ({
  scrolled,
  isMenuOpen,
  setIsMenuOpen,
}: LandingHeaderProps) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-6 md:py-6 transition-all duration-300",
          scrolled ? "py-3 md:py-4" : "",
        )}
      >
        <div
          className={cn(
            "max-w-7xl mx-auto flex items-center px-6 py-2.5 rounded-full border transition-all duration-700",
            scrolled
              ? "bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl"
              : "bg-transparent border-transparent shadow-none",
          )}
        >
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              className="flex items-center gap-2 md:gap-3 group shrink-0"
            >
              <div className="w-8 h-8 flex items-center justify-center group-hover:rotate-12 group-active:rotate-12 transition-transform">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm md:text-base font-black tracking-tight uppercase">
                Olùkọ́
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            <a
              href={location.pathname === "/" ? "#ecosystem" : "/#ecosystem"}
              className="hover:text-blue-600 active:text-blue-600 transition-colors"
            >
              Ecosystem
            </a>
            <a
              href={location.pathname === "/" ? "#features" : "/#features"}
              className="hover:text-blue-600 active:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href={location.pathname === "/" ? "#workflow" : "/#workflow"}
              className="hover:text-blue-600 active:text-blue-600 transition-colors"
            >
              Workflow
            </a>
          </nav>

          <div className="flex-1 flex items-center justify-end gap-1 md:gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center">
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button className="h-10 px-6 rounded-full bg-blue-600 dark:bg-white text-white dark:text-white font-black text-xs uppercase tracking-wider md:hover:scale-105 transition-all border-none md:active:scale-95">
                  {isAuthenticated ? "Dashboard" : "Get Started"}
                </Button>
              </Link>
            </div>
            <button
              className="md:hidden p-2 text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all md:active:scale-95"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white/95 dark:bg-[#02040a]/95 backdrop-blur-2xl pt-32 px-10 md:hidden"
          >
            <nav className="flex flex-col gap-10">
              {[
                {
                  t: "Ecosystem",
                  h: location.pathname === "/" ? "#ecosystem" : "/#ecosystem",
                },
                {
                  t: "Features",
                  h: location.pathname === "/" ? "#features" : "/#features",
                },
                {
                  t: "Workflow",
                  h: location.pathname === "/" ? "#workflow" : "/#workflow",
                },
              ].map((item) => (
                <a
                  key={item.t}
                  href={item.h}
                  className="text-5xl font-black tracking-tighter hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.t}
                </a>
              ))}
              <div className="pt-10 border-t border-slate-200 dark:border-white/10 flex flex-col">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/signup"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full h-16 text-xl bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest md:active:scale-95">
                    {isAuthenticated ? "Dashboard" : "Get Started"}
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
