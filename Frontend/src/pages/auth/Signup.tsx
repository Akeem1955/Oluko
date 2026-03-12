import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { useToastStore } from "@/lib/store/toastStore";
import {
  validateEmail,
  validatePassword,
  validateFullName,
} from "@/lib/utils/validation";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = "Full name must be at least 2 characters";
      addToast(newErrors.fullName, "error");
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      addToast(newErrors.email, "error");
    }
    if (!validatePassword(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character";
      addToast(newErrors.password, "error");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      signup.mutate(formData);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
        if (errors[field]) {
          setErrors({ ...errors, [field]: "" });
        }
      };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#02040a] text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Simple background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center cursor-pointer gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-lg mb-6">
              <GraduationCap className="w-8 h-8 text-white dark:text-slate-900" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Join Olùkọ́.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-center text-sm md:text-base">
              Unlock your full learning potential today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              icon={<User className="w-5 h-5 text-slate-400" />}
              error={errors.fullName}
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              icon={<Mail className="w-5 h-5 text-slate-400" />}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange("password")}
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              error={errors.password}
            />

            <div className="text-xs text-slate-500 leading-relaxed px-2">
              By adding your credentials, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-blue-600">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-blue-600">
                Privacy Policy
              </Link>
              .
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-black dark:text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
              disabled={signup.isPending}
              loading={signup.isPending}
            >
              {signup.isPending ? "Creating Account..." : "Get Started"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already a member?{" "}
              <Link
                to="/login"
                className="text-slate-900 dark:text-white font-bold hover:underline"
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
