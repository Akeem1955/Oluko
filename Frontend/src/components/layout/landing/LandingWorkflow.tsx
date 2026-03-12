import { motion } from "framer-motion";
import { WORKFLOW_STEPS } from "@/lib/constants/landing";

export const LandingWorkflow = () => {
  return (
    <section
      id="workflow"
      className="py-32 md:py-64 px-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.03),transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-600 mb-6"
        >
          Olùkọ́ Workflow
        </motion.div>

        <h2 className="text-5xl md:text-8xl font-black mb-24 leading-[0.85] tracking-tight">
          Learning <br />
          <span className="text-transparent bg-clip-text bg-linear-to-b from-slate-400 to-slate-900 dark:from-white dark:to-white/20">
            Simplified.
          </span>
        </h2>

        <div className="relative space-y-40">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-blue-500/50 to-transparent -translate-x-1/2" />

          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="relative flex flex-col cursor-pointer items-center group"
            >
              <div className="relative mb-16">
                <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full md:scale-150 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-1000" />

                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center relative">
                  {i === 0 && (
                    <div className="w-full h-full border border-blue-500/20 rotate-45 flex items-center justify-center group-hover:rotate-135 group-active:rotate-135 transition-transform duration-1000">
                      <div className="w-1/2 h-1/2 border border-blue-500/40" />
                    </div>
                  )}
                  {i === 1 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-full h-px bg-blue-500/30 absolute rotate-45" />
                      <div className="w-full h-px bg-blue-500/30 absolute -rotate-45" />
                      <div className="w-12 h-12 rounded-full border border-blue-500/60 bg-blue-500/5 animate-pulse" />
                    </div>
                  )}
                  {i === 2 && (
                    <div className="w-full h-full flex items-center justify-center">
                      {[...Array(3)].map((_, j) => (
                        <div
                          key={j}
                          className="absolute w-16 h-16 border-t border-l border-blue-500/40"
                          style={{
                            transform: `rotate(${j * 120}deg) translateY(-8px) rotate(-${j * 120}deg)`,
                          }}
                        />
                      ))}
                      <div className="w-4 h-4 bg-blue-600 rotate-45 shadow-[0_0_20px_rgba(37,99,235,1)]" />
                    </div>
                  )}
                  {i === 3 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 flex items-center justify-center animate-pulse">
                          <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,1)]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-blue-600/40 group-hover:text-blue-600 group-active:text-blue-600 transition-colors uppercase tracking-widest">
                      {step.n}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-w-lg">
                <h3 className="text-3xl md:text-5xl font-black mb-6 tracking-tight group-hover:text-blue-600 group-active:text-blue-600 transition-colors duration-500">
                  {step.t}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium leading-relaxed tracking-tight text-center">
                  {step.d}
                </p>
              </div>

              {i !== WORKFLOW_STEPS.length - 1 && (
                <div className="mt-20 flex flex-col items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500/20" />
                  <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                  <div className="w-1 h-1 rounded-full bg-blue-500/60" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
