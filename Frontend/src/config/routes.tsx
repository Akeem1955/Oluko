import { lazy, ReactNode } from "react";

const Landing = lazy(() => import("@/pages/home/Landing"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Analytics = lazy(() => import("@/pages/dashboard/Analytics"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const Login = lazy(() => import("@/pages/auth/Login"));
const VerifyOtp = lazy(() => import("@/pages/auth/VerifyOtp"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const Classes = lazy(() => import("@/pages/dashboard/Classes"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const QuizMode = lazy(() => import("@/pages/dashboard/QuizMode"));
const TeachMe = lazy(() => import("@/pages/dashboard/TeachMe"));
const Community = lazy(() => import("@/pages/dashboard/Community"));
const LessonUnitsList = lazy(() => import("@/pages/teach-me/LessonUnitsList"));
const Privacy = lazy(() => import("@/pages/home/Privacy"));
const Terms = lazy(() => import("@/pages/home/Terms"));
const VideoSelection = lazy(
  () => import("@/pages/teach-me/VideoSelection"),
);
const PDFSelection = lazy(() => import("@/pages/teach-me/PDFSelection"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export interface AppRoute {
  path: string;
  element: ReactNode;
  requiresAuth?: boolean;
  guestOnly?: boolean;
  title?: string;
}

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes: AppRoute[] = [
  {
    path: "/",
    element: <Landing />,
    title: "Home",
    guestOnly: true,
  },

  {
    path: "/signup",
    element: <Signup />,
    title: "Sign Up",
    guestOnly: true,
  },
  {
    path: "/login",
    element: <Login />,
    title: "Login",
    guestOnly: true,
  },
  {
    path: "/verify-signup",
    element: <VerifyOtp type="signup" />,
    title: "Verify Signup",
    guestOnly: true,
  },
  {
    path: "/verify-login",
    element: <VerifyOtp type="login" />,
    title: "Verify Login",
    guestOnly: true,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtp />,
    title: "Verify OTP",
    guestOnly: true,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    title: "Forgot Password",
    guestOnly: true,
  },
  {
    path: "/privacy",
    element: <Privacy />,
    title: "Privacy Policy",
  },
  {
    path: "/terms",
    element: <Terms />,
    title: "Terms of Service",
  },
];

/**
 * Protected routes - require authentication
 */
export const protectedRoutes: AppRoute[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    requiresAuth: true,
    title: "Dashboard",
  },
  {
    path: "/analytics",
    element: <Analytics />,
    requiresAuth: true,
    title: "Analytics",
  },
  {
    path: "/teach-me/class/units",
    element: <LessonUnitsList />,
    requiresAuth: true,
    title: "Class Curriculum",
  },
  {
    path: "/teach-me/video-setup",
    element: <VideoSelection />,
    requiresAuth: true,
    title: "New Video Class",
  },
  {
    path: "/teach-me/pdf-setup",
    element: <PDFSelection />,
    requiresAuth: true,
    title: "New PDF Class",
  },
  {
    path: "/classes",
    element: <Classes />,
    requiresAuth: true,
    title: "My Classes",
  },
  {
    path: "/settings",
    element: <Settings />,
    requiresAuth: true,
    title: "Settings",
  },
  {
    path: "/quiz",
    element: <QuizMode />,
    requiresAuth: true,
    title: "Quiz Mode",
  },
  {
    path: "/teach-me/*",
    element: <TeachMe />,
    requiresAuth: true,
    title: "Teach Me",
  },
  {
    path: "/community",
    element: <Community />,
    requiresAuth: true,
    title: "Community",
  },
];

/**
 * Catch-all route for 404
 */
export const notFoundRoute: AppRoute = {
  path: "*",
  element: <NotFound />,
  title: "Page Not Found",
};

/**
 * All routes combined
 */
export const routes: AppRoute[] = [
  ...publicRoutes,
  ...protectedRoutes,
  notFoundRoute,
];
