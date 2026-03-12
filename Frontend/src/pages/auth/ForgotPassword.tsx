import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { useToastStore } from "@/lib/store/toastStore";
import { validateEmail } from "@/lib/utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { addToast } = useToastStore();

  const validate = () => {
    if (!validateEmail(email)) {
      const msg = "Please enter a valid email address";
      setError(msg);
      addToast(msg, "error");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      resetPassword.mutate(email);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#02040a] text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Simple background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate("/login")}
          className="mb-8 flex items-center cursor-pointer gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 group transition-transform hover:scale-105">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Reset Password.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
              We'll send a code to your email to securely reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={handleChange}
              icon={<Mail className="w-5 h-5 text-slate-400" />}
              placeholder="e.g. name@example.com"
              error={error}
            />

            <Button
              type="submit"
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-600/20"
              disabled={resetPassword.isPending}
              loading={resetPassword.isPending}
            >
              {resetPassword.isPending ? "Sending OTP..." : "Send Reset Code"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-sm font-medium text-slate-500">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
