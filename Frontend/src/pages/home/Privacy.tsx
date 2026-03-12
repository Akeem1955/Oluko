import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LandingHeader } from "@/components/layout/landing/LandingHeader";
import { LandingFooter } from "@/components/layout/landing/LandingFooter";
import { LandingBackground } from "@/components/layout/landing/LandingBackground";

export default function Privacy() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(now);
  const currentYear = now.getUTCFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#02040c] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <LandingBackground />

      <LandingHeader
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/signup", { replace: true })}
            className="inline-flex items-center cursor-pointer gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign Up
          </button>

          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 md:p-12 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">
              Privacy Policy
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-h2:text-2xl prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-400">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-8">
                Last updated: {currentMonth} {currentYear}
              </p>

              <div className="space-y-3">
                <div>
                  <h2 className="font-medium text-lg">
                    1. Information We Collect
                  </h2>
                  <p>
                    We collect information required to personalize your learning
                    journey. This includes account details, learning
                    preferences, and content you provide to Olùkọ́ (such as
                    uploaded PDFs, YouTube links, and questions). We also track
                    your progress to adapt future lessons and quizzes.
                  </p>
                </div>

                <div>
                  <h2 className="font-medium text-lg">
                    2. How We Use Your Information
                  </h2>
                  <p>
                    We use your data to power and improve our platform.
                    Specifically, we use it to:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Generate personalized lessons and quizzes</li>
                    <li>Adapt difficult concepts to your level</li>
                    <li>Improve Olùkọ́'s teaching capabilities</li>
                    <li>Track your study streaks and progress</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
