import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export const LandingCTA = () => (
  <section className="py-12 md:py-24 px-6 md:mb-12">
    <div className="max-w-4xl mx-auto rounded-3xl md:rounded-[48px] bg-slate-900 p-8 md:p-16 text-center relative overflow-hidden group border border-slate-800 dark:border-blue-500/20 shadow-2xl active:border-blue-500/40 transition-colors">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.15),transparent)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-1000" />
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight mb-8 md:mb-10 max-w-3xl mx-auto">
          Your next lesson is a conversation.
        </h2>
        <p className="text-base md:text-lg text-blue-100/60 font-medium mb-10 md:mb-12 max-w-lg mx-auto tracking-tight leading-relaxed">
          Join learners worldwide using Olùkọ́ to master any subject
          through live voice sessions with an AI that truly teaches.
        </p>
        <Link to="/signup" className="inline-block w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-14 md:h-16 px-10 md:px-12 rounded-2xl bg-blue-600 text-white font-black text-lg md:text-xl shadow-2xl hover:bg-blue-700 md:hover:scale-105 transition-all md:active:scale-95 active:bg-blue-700 border-none">
            Get Started
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);
