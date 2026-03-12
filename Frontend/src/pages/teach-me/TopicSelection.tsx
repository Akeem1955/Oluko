import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Zap,
  Brain,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { courseService } from "@/lib/services/courseService";
import { useCourseGenerationStore } from "@/lib/store/courseGenerationStore";
import { useToastStore } from "@/lib/store/toastStore";

export function TopicSelection() {
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const startPolling = useCourseGenerationStore((s) => s.startPolling);
  const { addToast } = useToastStore();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim() || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("learningMode", "TOPIC");
      formData.append("topic", topic);
      formData.append("targetLanguage", "English");
      const res = await courseService.generate(formData);
      startPolling(res.courseId, topic);
      navigate("/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create course.";
      addToast(msg, "error");
      setSubmitting(false);
    }
  };

  const suggestions = [
    { label: "Python Basics", icon: Zap },
    { label: "React Hooks", icon: Lightbulb },
    { label: "Quantum Physics", icon: Brain },
    { label: "French Revolution", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-r from-primary/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative z-10">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-primary/20 to-blue-500/20 border border-primary/30 backdrop-blur-sm">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                AI-Powered Learning
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              What do you want to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400">
                learn?
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-md mx-auto">
              Olùkọ́ will craft a personalized curriculum tailored just for you
            </p>
          </div>

          {/* Input section */}
          <form onSubmit={handleSubmit} className="mb-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-xl">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Introduction to Astrophysics..."
                  className="w-full sm:flex-1 h-14 px-6 bg-transparent text-white text-lg placeholder-slate-500 focus:outline-none min-w-0"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!topic.trim()}
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 rounded-xl bg-linear-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 shrink-0"
                >
                  <>
                    Teach Me
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                </Button>
              </div>
            </div>
          </form>

          {/* Suggestions section */}
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500 uppercase tracking-wider font-medium">
              Popular topics
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setTopic(label)}
                  className="group flex items-center cursor-pointer gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
                >
                  <Icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500">Powered by Olùkọ́.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
