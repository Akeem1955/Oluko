import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, ToastType } from "@/lib/store/toastStore";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { forwardRef } from "react";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-green-500/10 border-green-500/20 text-green-500",
  error: "bg-red-500/10 border-red-500/20 text-red-500",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
};

const ToastItem =forwardRef<
  HTMLDivElement, 
  { id: string; message: string; type: ToastType }
>(({id, message, type}, ref) => {
  const { removeToast } = useToastStore();
  const Icon = icons[type];

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl min-w-[300px] max-w-[450px] pointer-events-auto",
        colors[type],
        "bg-white/90 dark:bg-black/90",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-bold flex-1 text-slate-900 dark:text-slate-100 leading-tight">
        {message}
      </p>
      <button
        onClick={() => removeToast(id)}
        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer rounded-full transition-colors ml-1"
      >
        <X className="w-4 h-4 opacity-50" />
      </button>
    </motion.div>
  );
});

export const ToastContainer = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-3 pointer-events-none w-full max-w-md px-4 items-center">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
