import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { FEATURES } from "@/lib/constants/landing";
import { useIsMobile } from "@/lib/hooks/activity/useMediaQuery";

export const LandingFeatures = () => {
  const isMobile = useIsMobile();
  return (
    <section id="features" className="py-32 md:py-56 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 md:mb-24 gap-8">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black mb-6 md:mb-8 leading-tight tracking-tight">
              Built around <br /> how you learn.
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-tight">
              Four core experiences designed to take you from raw material to
              deep understanding.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
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
                delay: isMobile ? 0 : i * 0.1,
                ease: "easeOut",
              }}
              className={cn(
                "group relative p-10 rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/1 hover:bg-white dark:hover:bg-white/2 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-500/20 active:scale-95",
                feature.className,
              )}
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 group-active:opacity-100 translate-x-0 translate-y-0 group-hover:translate-x-[-10px] group-hover:translate-y-[10px] transition-all duration-500">
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 flex items-center justify-center mb-10 relative">
                  <div className="absolute inset-0 bg-blue-500/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-inner" />
                  <div className="absolute -inset-1 bg-blue-600/10 rounded-[20px] blur-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                  <feature.icon className="w-6 h-6 text-blue-600 relative z-10 md:group-hover:scale-110 md:group-active:scale-110 transition-transform duration-500" />
                </div>

                <h3 className="text-2xl font-black mb-4 tracking-[-0.02em] leading-none">
                  {feature.title}
                </h3>
                <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
