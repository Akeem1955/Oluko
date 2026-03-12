import { motion } from "framer-motion";
import {
  Mic,
  FileText,
  PenTool,
  ArrowUpRight,
  Brain,
  Upload,
} from "lucide-react";
import { useIsMobile } from "@/lib/hooks/activity/useMediaQuery";

// Pre-computed once at module level — never changes on re-render
const WAVEFORM_BARS = Array.from({ length: 12 }, () => ({
  maxHeight: 16 + Math.random() * 16,
  duration: 0.8 + Math.random() * 0.4,
}));

interface LandingEcosystemProps {
  ecoRef: React.RefObject<HTMLDivElement>;
}

export const LandingEcosystem = ({
  ecoRef,
}: LandingEcosystemProps) => {
  const isMobile = useIsMobile();
  return (
    <section
      id="ecosystem"
      ref={ecoRef}
      className="pt-24 pb-32 md:pt-32 md:pb-56 px-6 relative"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            How It Works
          </motion.div>
          <h2 className="text-4xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
            Four steps to <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-sky-400 animate-gradient-x">
              master anything.
            </span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Upload your material, let AI build the curriculum, learn through
            live voice sessions, and lock it in with quizzes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5 md:gap-8 lg:gap-10">
          {/* Story 1: Curriculum Generation - Wide */}
          <motion.div
            initial={{
              opacity: isMobile ? 0.8 : 0,
              y: isMobile ? 20 : 20,
              scale: isMobile ? 0.98 : 1,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="md:col-span-3 lg:col-span-7 cursor-pointer group relative overflow-hidden rounded-[3rem] bg-[#f8fafc] dark:bg-blue-900/10 border border-slate-200 dark:border-white/10 p-6 md:p-12 flex flex-col lg:flex-row gap-8 md:gap-10 items-center shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-colors duration-300 min-h-[300px] md:min-h-[350px]"
          >
            <div className="flex-1 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-10 shadow-lg shadow-blue-500/20">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-tight">
                Curriculum Generation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Upload a PDF, a video (up to 25 MB), or type any topic.
                Olùkọ́'s AI instantly builds a structured course with
                lessons, objectives, and a logical progression.
              </p>
            </div>
            <div className="w-full md:w-2/5 aspect-square rounded-3xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 overflow-hidden p-6">
              <div className="flex gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                  PDF
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-500 text-[10px] font-black uppercase tracking-wider">
                  Video
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-wider">
                  Topic
                </div>
              </div>
              <div className="w-10 h-px bg-slate-300 dark:bg-white/20" />
              <FileText className="w-8 h-8 text-slate-400 dark:text-white/30" />
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium uppercase tracking-wider">
                Drop your material
              </p>
            </div>
          </motion.div>

          {/* Story 2: Voice AI Tutor - Accent Card */}
          <motion.div
            initial={{
              opacity: isMobile ? 0.8 : 0,
              y: isMobile ? 20 : 20,
              scale: isMobile ? 0.98 : 1,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: "easeOut",
            }}
            whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="md:col-span-3 lg:col-span-5 cursor-pointer group relative overflow-hidden rounded-[3rem] bg-blue-600 p-6 md:p-12 flex flex-col justify-between shadow-xl shadow-blue-500/20 transition-colors duration-300 min-h-[300px] md:min-h-[350px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-10">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 uppercase text-white tracking-tight">
                Voice AI Tutor
              </h3>
              <p className="text-sm text-blue-50/80 font-medium leading-relaxed">
                Join a live voice session with your AI instructor. It speaks,
                listens, explains concepts, asks you questions, and adapts to
                your pace — like a private tutor in your headphones.
              </p>
            </div>
            <div className="flex items-center gap-1 mt-8">
              {WAVEFORM_BARS.map((bar, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/40 rounded-full"
                  style={{ height: bar.maxHeight }}
                />
              ))}
            </div>
            <div className="absolute top-0 right-0 p-10">
              <ArrowUpRight className="w-7 h-7 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </motion.div>

          {/* Story 3: Interactive Whiteboard */}
          <motion.div
            initial={{
              opacity: isMobile ? 0.8 : 0,
              y: isMobile ? 20 : 20,
              scale: isMobile ? 0.98 : 1,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
            whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="md:col-span-3 lg:col-span-5 cursor-pointer group relative overflow-hidden rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 md:p-12 flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-colors duration-300 min-h-[300px] md:min-h-[320px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center mb-10">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-tight">
                Interactive Whiteboard
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                While the AI teaches, it draws diagrams, renders code, and
                projects visuals on a shared whiteboard in real time — just like
                a real classroom.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <div className="w-20 h-14 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                <PenTool className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex-1 h-14 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden relative">
                <div
                  className="absolute bottom-2 left-3 right-3 h-px bg-yellow-500/60"
                />
                <div
                  className="absolute bottom-5 left-3 w-8 h-px bg-yellow-500/40"
                />
              </div>
            </div>
          </motion.div>

          {/* Story 4: Concentration Mode - Wide */}
          <motion.div
            initial={{
              opacity: isMobile ? 0.8 : 0,
              y: isMobile ? 20 : 20,
              scale: isMobile ? 0.98 : 1,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
            whileTap={isMobile ? {} : { scale: 0.95 }}
            className="md:col-span-6 lg:col-span-7 cursor-pointer group relative overflow-hidden rounded-[3rem] bg-slate-900 border border-slate-800 p-6 md:p-12 flex flex-col justify-between shadow-2xl transition-colors duration-300 min-h-[300px] md:min-h-[320px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mb-10">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 uppercase text-white tracking-tight">
                Concentration Mode
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
                Upload your study material and switch to self-study. The AI
                quizzes you on it through voice — a focused mode designed to
                lock in understanding until the concepts stick.
              </p>
            </div>
            <div className="flex gap-4 items-end mt-6">
              {["Q1", "Q2", "Q3", "Q4"].map((q, i) => (
                <div
                  key={q}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${24 + i * 16}px` }}
                    className="w-10 bg-green-500/60 rounded-md"
                  />
                  <span className="text-[9px] text-slate-500 font-bold uppercase">
                    {q}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
