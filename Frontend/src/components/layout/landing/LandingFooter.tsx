import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export const LandingFooter = () => (
  <footer className="relative z-10 py-20 md:py-32 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-16 md:gap-24">
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Olùkọ́
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Redefining the architecture of human knowledge acquisition through
            neural synthesis and adaptive mastery.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 md:gap-20">
          <div className="space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.5em] text-blue-600">
              Platform
            </p>
            <div className="flex flex-col gap-4 text-sm font-bold tracking-tight text-slate-500 dark:text-slate-400">
              <a
                href="#features"
                className="hover:text-blue-600 dark:hover:text-blue-500 active:text-blue-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#ecosystem"
                className="hover:text-blue-600 dark:hover:text-blue-500 active:text-blue-600 transition-colors"
              >
                Ecosystem
              </a>
              <a
                href="#workflow"
                className="hover:text-blue-600 dark:hover:text-blue-500 active:text-blue-600 transition-colors"
              >
                Workflow
              </a>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600">
              Legal
            </p>
            <div className="flex flex-col gap-4 text-sm font-bold tracking-tight text-slate-500 dark:text-slate-400">
              <Link
                to="/privacy"
                className="hover:text-blue-600 dark:hover:text-blue-500 active:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-blue-600 dark:hover:text-blue-500 active:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20 md:mt-24 pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Olùkọ́
        </p>
      </div>
    </div>
  </footer>
);
