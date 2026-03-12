import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/services/authService";
import { useAuthStore } from "@/lib/store/authStore";
import { useToastStore } from "@/lib/store/toastStore";
import { LoginRequest, SignupRequest, OtpRequest } from "@/lib/types";

export const useAuth = () => {
  const navigate = useNavigate();
  const { setToken, checkAuth, logout: storeLogout } = useAuthStore();
  const { addToast } = useToastStore();

  const signupMutation = useMutation({
    mutationFn: (data: SignupRequest) => authService.signup(data),
    onSuccess: (_data: any, variables: SignupRequest) => {
      addToast("OTP sent to your email", "success");
      navigate(`/verify-signup?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      addToast(error.message || "Signup failed", "error");
    },
  });

  const verifySignupMutation = useMutation({
    mutationFn: (data: OtpRequest) => authService.verifySignup(data),
    onSuccess: async (token: string) => {
      setToken(token);
      await checkAuth(); // Fetch user data
      addToast("Account verified successfully!", "success");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      addToast(error.message || "Verification failed", "error");
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (_data: any, variables: LoginRequest) => {
      addToast("OTP sent to your email", "success");
      navigate(`/verify-login?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      addToast(error.message || "Login failed", "error");
    },
  });

  const verifyLoginMutation = useMutation({
    mutationFn: (data: OtpRequest) => authService.verifyLogin(data),
    onSuccess: async (token: string) => {
      setToken(token);
      await checkAuth();
      addToast("Welcome back!", "success");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      addToast(error.message || "Verification failed", "error");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.resetPassword(email),
    onSuccess: (_data: any, email: string) => {
      addToast("OTP sent for password reset", "success");
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&mode=reset`);
    },
    onError: (error: any) => {
      addToast(error.message || "Failed to send reset OTP", "error");
    },
  });

  const verifyResetPasswordMutation = useMutation({
    mutationFn: (data: OtpRequest & { newPassword: string }) =>
      authService.verifyResetPassword(data),
    onSuccess: () => {
      addToast("Password reset successfully. Please login.", "success");
      navigate("/login");
    },
    onError: (error: any) => {
      addToast(error.message || "Password reset failed", "error");
    },
  });

  const logout = () => {
    storeLogout();
    addToast("Logged out successfully", "success");
    navigate("/", { replace: true });
  };

  return {
    signup: signupMutation,
    verifySignup: verifySignupMutation,
    login: loginMutation,
    verifyLogin: verifyLoginMutation,
    resetPassword: resetPasswordMutation,
    verifyResetPassword: verifyResetPasswordMutation,
    logout,
  };
};
