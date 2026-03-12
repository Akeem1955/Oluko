import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export const LandingTestimonial = () => (
  <section className="py-20 md:py-40 px-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto px-4"
    >
      <h2 className="text-3xl md:text-5xl font-black mb-10 tracking-tight leading-tight">
        "Imagine a private tutor that speaks to you, draws on a whiteboard, and
        never runs out of patience — that's Olùkọ́."
      </h2>
      <div className="flex items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-blue-600 flex items-center justify-center overflow-hidden">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-widest leading-none">
            Olùkọ́
          </p>
          <p className="text-[9px] text-blue-600 dark:text-blue-500 font-bold tracking-widest uppercase mt-1">
            Voice-First AI Learning
          </p>
        </div>
      </div>
    </motion.div>
  </section>
);
