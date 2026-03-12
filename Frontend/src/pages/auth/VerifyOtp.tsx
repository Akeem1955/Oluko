import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { useToastStore } from "@/lib/store/toastStore";
import { validatePassword } from "@/lib/utils/validation";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

interface VerifyOtpProps {
  type?: "signup" | "login";
}

export default function VerifyOtp({ type }: VerifyOtpProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifySignup, verifyLogin, verifyResetPassword } = useAuth();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "login" | "reset">(
    type || "signup",
  );

  useEffect(() => {
    const e = searchParams.get("email");
    const m = searchParams.get("mode");
    if (e) setEmail(e);
    if (m) setMode(m as any);
    if (type) setMode(type);
  }, [searchParams, type]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      verifySignup.mutate({ email, otp });
    } else if (mode === "login") {
      verifyLogin.mutate({ email, otp });
    } else if (mode === "reset") {
      if (!validatePassword(newPassword)) {
        addToast(
          "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character",
          "error",
        );
        return;
      }
      verifyResetPassword.mutate({ email, otp, newPassword });
    }
  };

  const isLoading =
    verifySignup.isPending ||
    verifyLogin.isPending ||
    verifyResetPassword.isPending;
  const title = mode === "reset" ? "Reset Password" : "Verification";
  const subTitle =
    mode === "reset"
      ? "Set your new secure password"
      : "Enter the code sent to your email. Please check your spam folder if you don't see it in inbox.";

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#02040a] text-slate-900 dark:text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mb-8 flex items-center cursor-pointer gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex flex-col items-center mb-8 text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-6">
              {mode === "reset" ? (
                <KeyRound className="w-8 h-8 text-blue-600" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
              {subTitle}
            </p>
            <div className="mt-2 px-3 py-1 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
              {email}
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-5 relative z-10">
            <Input
              label="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="• • • • • • • •"
              className="text-center tracking-[0.5em] font-mono text-lg font-bold"
              maxLength={8}
              required
            />

            {mode === "reset" && (
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Securely"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
