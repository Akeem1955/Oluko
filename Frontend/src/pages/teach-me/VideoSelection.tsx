import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/lib/store/toastStore";
import { courseService } from "@/lib/services/courseService";
import { useCourseGenerationStore } from "@/lib/store/courseGenerationStore";

const MAX_VIDEO_SIZE_MB = 25;
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];

export default function VideoSelection() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();
  const startPolling = useCourseGenerationStore((s) => s.startPolling);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    if (!ACCEPTED_VIDEO_TYPES.includes(selectedFile.type)) {
      setError("Please upload a valid video file (MP4, WebM, MOV, or AVI).");
      addToast("Invalid file type. Please upload a video.", "error");
      setFile(null);
      return false;
    }
    if (selectedFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Max size is ${MAX_VIDEO_SIZE_MB}MB.`);
      addToast(`File too large! Max size is ${MAX_VIDEO_SIZE_MB}MB.`, "error");
      setFile(null);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
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
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError("");
    }
  };

  const handleCreateClass = async () => {
    if (!file || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("learningMode", "VIDEO");
      formData.append("file", file);
      formData.append("targetLanguage", "English");
      const res = await courseService.generate(formData);
      startPolling(res.courseId, file.name);
      navigate("/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create course.";
      addToast(msg, "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="p-4 md:p-6">
        <button
          onClick={() => navigate("/classes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Classes</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 w-full">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Film className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              New Video Class
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              Upload a video file to generate an interactive lesson.
            </p>
          </div>

          <div className="space-y-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/5 transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-purple-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-400">
                  MP4, WebM, MOV, AVI (max {MAX_VIDEO_SIZE_MB}MB)
                </p>
              </div>
            ) : (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB — Ready to
                      upload
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleCreateClass}
              disabled={!file || submitting}
              className="w-full h-12 text-lg font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Upload className="w-5 h-5 mr-2" />
              {submitting ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
