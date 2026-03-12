import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  Upload,
  MessageCircle,
  BrainCircuit,
  Check,
  Clock,
  Flame,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatsCard, RecentActivity } from "@/components/shared";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { cn, formatDate } from "@/lib/utils/utils";
import { authService } from "@/lib/services/authService";
import { useAuthStore } from "@/lib/store/authStore";

const formatTime = (minutes: number) => {
  if (!minutes) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
};

const LEARNING_MODES = [
  {
    id: "topic",
    title: "Topic Tutor",
    description:
      "Get a full curriculum generated from any topic with voice AI tutoring.",
    icon: MessageCircle,
    href: "/teach-me/topic",
    buttonText: "Start Learning",
    gradient: "from-blue-500/10 to-blue-600/10",
    hoverBorder: "hover:border-blue-200",
    iconBg:
      "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-600/20",
    iconColor: "text-blue-600",
    comingSoon: false,
  },
  {
    id: "document",
    title: "Document Tutor",
    description:
      "Upload a PDF and let the AI break it down into interactive lessons.",
    icon: Upload,
    href: "/teach-me/pdf-setup",
    buttonText: "Start Learning",
    gradient: "from-emerald-500/10 to-emerald-600/10",
    hoverBorder: "hover:border-emerald-200",
    iconBg:
      "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-600/20",
    iconColor: "text-emerald-600",
    comingSoon: false,
  },
  {
    id: "video",
    title: "Video Tutor",
    description:
      "Upload a video file and turn it into an AI-tutored learning experience.",
    icon: Play,
    href: "/teach-me/video-setup",
    buttonText: "Start Session",
    gradient: "from-purple-500/10 to-purple-600/10",
    hoverBorder: "hover:border-purple-200",
    iconBg:
      "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-600/20",
    iconColor: "text-purple-500",
    comingSoon: false,
  },
  {
    id: "concentration",
    title: "Concentration Mode",
    description:
      "Upload a PDF and select pages — the AI quizzes you via voice until the concepts stick.",
    icon: BrainCircuit,
    href: "/teach-me/concentration",
    buttonText: "Start Quiz",
    gradient: "from-amber-500/10 to-amber-600/10",
    hoverBorder: "hover:border-amber-200",
    iconBg:
      "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-600/20",
    iconColor: "text-amber-600",
    comingSoon: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

import { useRecentClasses } from "@/lib/hooks/useClasses";

export default function Dashboard() {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("");

  const { data: classes = [], isLoading: loading } = useRecentClasses();

  const recentActivity = classes.map((cls: any) => ({
    id: cls.id.toString(),
    title: cls.title,
    type: (cls.learningMode === "VIDEO"
      ? "Video"
      : cls.learningMode === "DOCUMENT"
        ? "PDF"
        : "Quiz") as "Video" | "PDF" | "Quiz",
    thumbnail: "",
    progress: 0,
    timeAgo: formatDate(new Date(cls.createdAt)),
  }));

  useEffect(() => {
    if (!user) return;
    const hasGoal = (user.stats?.weeklyGoalHours ?? 0) > 0;
    const prompted = localStorage.getItem("weeklyGoalPrompted") === "true";
    if (!hasGoal && !prompted) {
      setShowGoalPrompt(true);
    }
  }, [user]);

  const handleGoalSubmit = async () => {
    if (!goalInput) return;
    try {
      await authService.updateProfile({ weeklyGoalHours: parseInt(goalInput) });
      setShowGoalPrompt(false);
      localStorage.setItem("weeklyGoalPrompted", "true");
      await checkAuth();
    } catch (e) {
      console.error("Failed to save goal", e);
    }
  };

  if (loading) return;

  const stats = user?.stats;
  const weeklyGoalHours = stats?.weeklyGoalHours || 1;
  const totalGoalMinutes = weeklyGoalHours * 60;
  const minutesSpent = stats?.totalMinutesSpent || 0;
  const goalProgress = Math.min(100, (minutesSpent / totalGoalMinutes) * 100);

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1440px] w-full mx-auto p-6 lg:p-10 grid grid-cols-1 xl:grid-cols-12 gap-8"
      >
        <div className="xl:col-span-8 flex flex-col gap-8">
          <motion.section
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary-dark to-primary p-8 md:p-10 text-white shadow-lg shadow-primary/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-20 w-40 h-40 bg-blue-900/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4" />
                  <span>{stats?.currentStreak || 0} Day Streak</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  Welcome back, {user?.fullName}!
                </h1>
                <p className="text-blue-100 max-w-md text-sm md:text-base opacity-90">
                  Ready to continue your learning journey?
                </p>
              </div>
              <div className="shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-3xl font-bold">
                    {Number(goalProgress.toFixed(2))}
                  </span>
                  <span className="text-xs text-blue-100 uppercase tracking-wide">
                    Weekly Goal ({stats?.weeklyGoalHours || "?"}h)
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Choose Learning Mode
            </h2>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          >
            {LEARNING_MODES.map((mode) => (
              <div
                key={mode.id}
                className={cn(
                  "group relative flex flex-col bg-white dark:bg-card-dark rounded-2xl p-6",
                  "shadow-soft hover:shadow-lg transition-all duration-300",
                  "border border-transparent overflow-hidden",
                  mode.hoverBorder,
                )}
              >
                <div
                  className={cn(
                    "absolute top-0 right-0 w-32 h-32 bg-linear-to-br rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500",
                    mode.gradient,
                  )}
                />
                <div
                  className={cn(
                    "mb-6 w-14 h-14 rounded-xl bg-linear-to-br flex items-center justify-center",
                    mode.iconBg,
                    mode.iconColor,
                  )}
                >
                  <mode.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {mode.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 leading-relaxed">
                  {mode.description}
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (mode.comingSoon) {
                      setComingSoonFeature(mode.title);
                      setShowComingSoon(true);
                    } else {
                      navigate(mode.href!);
                    }
                  }}
                  variant={mode.comingSoon ? "secondary" : "primary"}
                >
                  {mode.buttonText}
                  {!mode.comingSoon && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-auto pt-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Your Progress
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                icon={<Check className="w-5 h-5" />}
                value={stats?.lessonsCompleted || 0}
                label="Lessons Done"
                iconBgColor="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600"
              />
              <StatsCard
                icon={<Clock className="w-5 h-5" />}
                value={formatTime(stats?.totalMinutesSpent || 0)}
                label="Hours Spent"
                iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600"
              />
              <StatsCard
                icon={<Flame className="w-5 h-5" />}
                value={stats?.currentStreak || 0}
                label="Current Streak"
                iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                iconColor="text-orange-600"
              />
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="xl:col-span-4">
          <RecentActivity sessions={recentActivity} className="h-full" />
        </motion.div>
      </motion.div>

      {showGoalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Set Weekly Goal</h3>
            <p className="text-sm text-gray-500 mb-4">
              How many hours do you want to learn per week?
            </p>
            <Input
              type="number"
              placeholder="e.g. 5"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="mb-4"
            />
            <Button onClick={handleGoalSubmit} className="w-full">
              Save Goal
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showComingSoon}
        title="Coming Soon!"
        message={`${comingSoonFeature} is currently under development and will be available soon.\n\nWe're working hard to bring you this feature. Stay tuned for updates!`}
        confirmText="Got it"
        cancelText=""
        onConfirm={() => setShowComingSoon(false)}
        onCancel={() => setShowComingSoon(false)}
      />
    </AppLayout>
  );
}
