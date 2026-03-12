import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();

  const quickLinks = [
    { icon: BookOpen, label: "My Classes", path: "/classes" },
    { icon: Sparkles, label: "Create Class", path: "/teach-me" },
    { icon: TrendingUp, label: "Dashboard", path: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(100 116 139) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-4xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Main content card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-12 mb-6">
            {/* 404 with icon */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="bg-primary/10 p-3 md:p-4 rounded-xl md:rounded-2xl"
              >
                <BookOpen
                  className="w-10 h-10 md:w-12 md:h-12 text-primary"
                  strokeWidth={2}
                />
              </motion.div>

              <h1 className="text-8xl md:text-9xl font-black leading-none text-transparent bg-clip-text bg-linear-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                404
              </h1>
            </div>

            {/* Message */}
            <div className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4">
                Page Not Found
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto px-4 md:px-0">
                This page doesn't exist. Let's get you back to learning.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8 md:mb-10 px-4 md:px-0">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full sm:w-auto min-w-[160px]"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>

              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto min-w-[160px]"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>

            {/* Quick links */}
            <div className="pt-6 md:pt-8 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-3 md:mb-4 font-medium">
                Quick Navigation
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-3">
                {quickLinks.map(({ icon: Icon, label, path }) => (
                  <motion.button
                    key={path}
                    onClick={() => navigate(path)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-primary/10 border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/30 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all w-full sm:w-auto"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs md:text-sm text-slate-500 dark:text-slate-400 px-4"
          >
            Lost? Try using the navigation above or{" "}
            <button
              onClick={() => navigate("/settings")}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              check your settings
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
