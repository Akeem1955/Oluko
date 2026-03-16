import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  BookOpen,
  BookCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastStore } from "@/lib/store/toastStore";
import { quizService } from "@/lib/services/quizService";
import { PDFDocument } from "pdf-lib";

/**
 * ConcentrationMode — Self-Study Quiz Flow (Epic 4).
 *
 * 1. User uploads a PDF and selects a page range.
 * 2. User reads selected pages silently on a dedicated reading screen.
 * 3. Clicking "I'm Done" triggers quiz generation and session setup.
 * 4. Once ready, navigate to a LiveKit room
 *    where the AI agent will quiz the student via voice.
 */
export default function ConcentrationMode() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<"setup" | "reading">("setup");
  const [file, setFile] = useState<File | null>(null);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparingReading, setIsPreparingReading] = useState(false);
  const [error, setError] = useState("");
  const [focusedPreviewUrl, setFocusedPreviewUrl] = useState("");
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setupPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (setupPreviewUrl) {
        URL.revokeObjectURL(setupPreviewUrl);
      }
      if (focusedPreviewUrl) {
        URL.revokeObjectURL(focusedPreviewUrl);
      }
    };
  }, [setupPreviewUrl, focusedPreviewUrl]);

  const parseRange = () => {
    const start = Math.max(1, parseInt(startPage) || 1);
    const end = Math.max(start, parseInt(endPage) || start);
    return { start, end };
  };

  const createFocusedPdfPreview = async (
    pdfFile: File,
    start: number,
    end: number,
  ): Promise<{ url: string; safeEnd: number; totalPages: number }> => {
    const sourceBytes = await pdfFile.arrayBuffer();
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const totalPages = sourcePdf.getPageCount();

    if (start > totalPages) {
      throw new Error(`Start page ${start} exceeds document length (${totalPages} pages).`);
    }

    const safeEnd = Math.min(end, totalPages);
    const pageIndexes = Array.from({ length: safeEnd - start + 1 }, (_, index) => start - 1 + index);

    const focusedPdf = await PDFDocument.create();
    const copiedPages = await focusedPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => focusedPdf.addPage(page));

    const focusedBytes = await focusedPdf.save();
    const focusedArrayBuffer = new ArrayBuffer(focusedBytes.byteLength);
    new Uint8Array(focusedArrayBuffer).set(focusedBytes);
    const focusedBlob = new Blob([focusedArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(focusedBlob);

    return { url, safeEnd, totalPages };
  };

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
      setStep("setup");
      if (focusedPreviewUrl) {
        URL.revokeObjectURL(focusedPreviewUrl);
        setFocusedPreviewUrl("");
      }
      setSelectedRange(null);
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
      setStep("setup");
      if (focusedPreviewUrl) {
        URL.revokeObjectURL(focusedPreviewUrl);
        setFocusedPreviewUrl("");
      }
      setSelectedRange(null);
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleProceedToReading = async () => {
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }

    const { start, end } = parseRange();

    if (start < 1) {
      setError("Start page must be at least 1.");
      return;
    }

    if (end < start) {
      setError("End page must be greater than or equal to start page.");
      return;
    }

    setIsPreparingReading(true);
    setError("");

    try {
      const { url, safeEnd, totalPages } = await createFocusedPdfPreview(file, start, end);

      if (focusedPreviewUrl) {
        URL.revokeObjectURL(focusedPreviewUrl);
      }

      setFocusedPreviewUrl(url);
      setSelectedRange({ start, end: safeEnd });
      setStep("reading");

      if (safeEnd < end) {
        addToast(
          `End page adjusted to ${safeEnd} because this file has ${totalPages} pages.`,
          "info",
        );
      }
    } catch (e: any) {
      const message = e?.message || "Could not prepare the selected page range.";
      setError(message);
      addToast(message, "error");
    } finally {
      setIsPreparingReading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!file) return;

    const { start, end } = selectedRange || parseRange();

    setIsLoading(true);
    setError("");

    try {
      const result = await quizService.generateQuiz(file, start, end);

      if (result.message && result.lessonId) {
        addToast("Quiz ready! Entering session...", "success");
        // Navigate to the lesson room — the agent will run the quiz
        navigate(`/teach-me/session/${result.lessonId}`, {
          replace: true,
          state: { lessonId: result.lessonId, quizMode: true },
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

  const displayStart = selectedRange?.start ?? (parseInt(startPage) || 1);
  const displayEnd = selectedRange?.end ?? (parseInt(endPage) || parseInt(startPage) || 1);
  const setupViewerUrl = setupPreviewUrl ? `${setupPreviewUrl}#view=FitH` : "";
  const focusedViewerUrl = focusedPreviewUrl ? `${focusedPreviewUrl}#view=FitH` : "";

  return (
    <div className="fixed inset-0 z-40 bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">
          Concentration Mode
        </h1>
        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {step === "setup" ? "Step 1/2: Setup" : "Step 2/2: Reading"}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mx-4 md:mx-6 mt-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "setup" && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          <div className="h-full overflow-y-auto border-r border-slate-200 dark:border-slate-800 p-4 md:p-6 bg-white/80 dark:bg-slate-900/60">
            <div className="mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Choose PDF & Pages</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pick the exact pages you want to focus on.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative mb-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-purple-500" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white break-all">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300" />
                    <p className="text-sm text-slate-500">Drop PDF or click to browse</p>
                    <p className="text-xs text-slate-400">Max 10 MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
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
                  placeholder="Same as start"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleProceedToReading}
              disabled={!file || isPreparingReading}
              className="w-full"
            >
              {isPreparingReading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Preparing Focused Pages...
                </>
              ) : (
                "Continue to Reading"
              )}
            </Button>
          </div>

          <div className="h-full min-h-0 p-4 md:p-6">
            <div className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              {file ? (
                <iframe
                  src={setupViewerUrl}
                  title="PDF Preview"
                  className="w-full h-full"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                  Upload a PDF to preview it here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "reading" && file && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BookCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Focused Reading</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing only pages {displayStart} to {displayEnd}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-4 md:p-6">
            <div className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <iframe
                src={focusedViewerUrl}
                title="Focused Reading PDF"
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex gap-3">
            <Button
              onClick={() => setStep("setup")}
              className="flex-1"
              variant="secondary"
              disabled={isLoading}
            >
              Edit PDF / Pages
            </Button>
            <Button
              onClick={handleStartQuiz}
              disabled={!file || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Quiz...
                </>
              ) : (
                "I'm Done — Start Quiz"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
