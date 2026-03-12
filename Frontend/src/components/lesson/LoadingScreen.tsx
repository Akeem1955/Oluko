import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingBackground } from "@/components/layout/landing/LandingBackground";

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  message,
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-9999 overflow-hidden bg-slate-50 dark:bg-[#02040c]">
      <LandingBackground />

      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
        {/* Animated Avatar Box */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Glowing rings */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-2 border border-primary/20 rounded-full border-dashed"
          />

          <div className="relative w-20 h-20 rounded-full p-1 bg-linear-to-br from-primary to-blue-500 shadow-2xl shadow-primary/20">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
              <span className="text-2xl font-black text-primary">NF</span>
            </div>
          </div>
        </motion.div>

        {/* Text Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center space-y-4 mb-10"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Preparing Your <span className="text-primary">Lesson</span>
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-slate-500 dark:text-slate-400 font-medium"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-4">
          <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-linear-to-r from-primary via-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
            <span className="text-slate-400 dark:text-slate-500">Progress</span>
            <span className="text-primary">{progress}%</span>
          </div>
        </div>

        {/* Subtle Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex items-center gap-2"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            Olùkọ́ is curating content
          </span>
        </motion.div>
      </div>
    </div>
  );
};
