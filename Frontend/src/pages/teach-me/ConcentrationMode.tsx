import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToastStore } from "@/lib/store/toastStore";
import { quizService } from "@/lib/services/quizService";

/**
 * ConcentrationMode — Self-Study Quiz Flow (Epic 4).
 *
 * 1. User uploads a PDF and selects a page range.
 * 2. POST /api/v1/lessons/{lessonId}/generate-quiz triggers quiz generation.
 * 3. Once ready (returns { ready: true }), navigate to a LiveKit room
 *    where the AI agent will quiz the student via voice.
 */
export default function ConcentrationMode() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [file, setFile] = useState<File | null>(null);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("File is too large. Max size is 10 MB.");
        setFile(null);
        return;
      }
      setFile(selected);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === "application/pdf") {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Max size is 10 MB.");
        return;
      }
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleStartQuiz = async () => {
    if (!file || !lessonId) return;

    const start = parseInt(startPage) || 1;
    const end = parseInt(endPage) || undefined;

    setIsLoading(true);
    setError("");

    try {
      const result = await quizService.generateQuiz(lessonId, file, start, end);

      if (result.message) {
        addToast("Quiz ready! Entering session...", "success");
        // Navigate to the lesson room — the agent will run the quiz
        navigate(`/teach-me/session/${lessonId}`, {
          replace: true,
          state: { lessonId, quizMode: true },
        });
      } else {
        addToast(
          "Quiz is being prepared. Please try again in a moment.",
          "info",
        );
      }
    } catch (err: any) {
      console.error("Quiz generation failed:", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to generate quiz. Please try again.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen w-full flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 w-full"
          >
            {/* Title */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Concentration Mode
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Upload a PDF document and select pages to generate a quiz. The
                AI tutor will quiz you live via voice.
              </p>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative mb-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                {file ? (
                  <>
                    <FileText className="w-10 h-10 text-purple-500" />
                    <p className="font-medium text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB — click to
                      replace
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-300 group-hover:text-purple-400 transition-colors" />
                    <p className="text-slate-500">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-xs text-slate-400">Max 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Page Range */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Page
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Page
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Last page"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              onClick={handleStartQuiz}
              disabled={!file || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Quiz...
                </>
              ) : (
                "Start Quiz Session"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
