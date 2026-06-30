import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Film,
  Youtube,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastStore } from "@/lib/store/toastStore";
import { courseService } from "@/lib/services/courseService";
import { useCourseGenerationStore } from "@/lib/store/courseGenerationStore";
import { loadYouTubeAPI, extractYouTubeVideoId } from "@/lib/utils/youtube";

export default function VideoSelection() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const startPolling = useCourseGenerationStore((s) => s.startPolling);

  // General navigation / tab state
  const [activeTab, setActiveTab] = useState<"upload" | "youtube">("upload");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submittingFile, setSubmittingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube Modality State
  const [url, setUrl] = useState("");
  const [youtubeTopic, setYoutubeTopic] = useState("");
  const [youtubeLanguage, setYoutubeLanguage] = useState("English");
  const [youtubeInterval, setYoutubeInterval] = useState("60");
  const [youtubePersonality, setYoutubePersonality] = useState("Ajibade");
  
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [videoData, setVideoData] = useState<{
    duration: number;
    title: string;
    videoId: string;
  } | null>(null);
  const [youtubeError, setYoutubeError] = useState("");
  const [submittingYoutube, setSubmittingYoutube] = useState(false);
  
  const playerRef = useRef<any>(null);

  // File upload constants
  const MAX_VIDEO_SIZE_MB = 25;
  const ACCEPTED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ];

  // Load YouTube Player API on mount
  useEffect(() => {
    loadYouTubeAPI().catch((err) => {
      console.error("Failed to load YouTube API:", err);
    });
  }, []);

  // File upload validation
  const validateFile = (selectedFile: File): boolean => {
    if (!ACCEPTED_VIDEO_TYPES.includes(selectedFile.type)) {
      setFileError("Please upload a valid video file (MP4, WebM, MOV, or AVI).");
      addToast("Invalid file type. Please upload a video.", "error");
      setFile(null);
      return false;
    }
    if (selectedFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Max size is ${MAX_VIDEO_SIZE_MB}MB.`);
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
      setFileError("");
    }
  };

  const handleCreateFileClass = async () => {
    if (!file || submittingFile) return;

    setSubmittingFile(true);
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
      setSubmittingFile(false);
    }
  };

  // YouTube Verification
  const handleVerifyYouTubeUrl = () => {
    setYoutubeError("");
    setVideoData(null);
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      setYoutubeError("Invalid YouTube URL. Please check and try again.");
      addToast("Invalid YouTube URL.", "error");
      return;
    }

    setIsLoadingMetadata(true);

    // If player already exists, load new video
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
      return;
    }

    const onPlayerReady = (event: any) => {
      const duration = event.target.getDuration();
      const data = event.target.getVideoData();

      if (duration > 0) {
        setVideoData({
          duration,
          title: data.title || "YouTube Video",
          videoId,
        });
        setIsLoadingMetadata(false);
        // Pre-fill topic focus if empty
        if (!youtubeTopic) {
          setYoutubeTopic(data.title || "");
        }
      } else {
        event.target.mute();
        event.target.playVideo();
      }
    };

    const onPlayerStateChange = (event: any) => {
      // If we had to play to get duration
      if (event.data === 1 || event.data === 5) {
        const duration = event.target.getDuration();
        if (duration > 0 && !videoData) {
          const data = event.target.getVideoData();
          setVideoData({
            duration,
            title: data.title || "YouTube Video",
            videoId,
          });
          setIsLoadingMetadata(false);
          // Pre-fill topic focus if empty
          if (!youtubeTopic) {
            setYoutubeTopic(data.title || "");
          }
          event.target.pauseVideo();
        }
      }
    };

    if (window.YT && window.YT.Player) {
      try {
        playerRef.current = new window.YT.Player("hidden-player", {
          height: "0",
          width: "0",
          videoId: videoId,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: () => {
              setYoutubeError("Failed to verify video. It might be private or restricted.");
              addToast("Failed to verify YouTube video.", "error");
              setIsLoadingMetadata(false);
            },
          },
        });
      } catch (e) {
        console.error("Error creating YouTube player:", e);
        setIsLoadingMetadata(false);
      }
    } else {
      setYoutubeError("YouTube API is loading. Please try again in a moment.");
      setIsLoadingMetadata(false);
    }
  };

  const handleCreateYouTubeClass = async () => {
    if (!videoData || !youtubeTopic.trim() || submittingYoutube) return;

    setSubmittingYoutube(true);
    try {
      const serializedQuery = `YOUTUBE_CLASS::url=${encodeURIComponent(
        url
      )}&interval=${youtubeInterval}&personality=${youtubePersonality}&topic=${encodeURIComponent(
        youtubeTopic
      )}&language=${youtubeLanguage}`;

      const formData = new FormData();
      formData.append("learningMode", "VIDEO");
      formData.append("targetLanguage", youtubeLanguage);
      formData.append("topic", serializedQuery);

      const res = await courseService.generate(formData);
      startPolling(res.courseId, youtubeTopic);
      addToast("YouTube Class generation started!", "success");
      navigate("/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create YouTube course.";
      addToast(msg, "error");
      setSubmittingYoutube(false);
    }
  };

  const formatDurationDisplay = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + "h " : ""}${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Hidden Player */}
      <div
        id="hidden-player"
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      />

      <div className="p-4 md:p-6">
        <button
          onClick={() => navigate("/classes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Classes</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full pb-16">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {activeTab === "upload" ? (
                <Film className="w-8 h-8 text-purple-600" />
              ) : (
                <Youtube className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              New Video Class
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {activeTab === "upload"
                ? "Upload a local video file to generate an interactive lesson."
                : "Paste a YouTube URL to customize your interactive video session."}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 pb-4 text-center font-bold border-b-2 transition-colors cursor-pointer text-sm md:text-base ${
                activeTab === "upload"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab("youtube")}
              className={`flex-1 pb-4 text-center font-bold border-b-2 transition-colors cursor-pointer text-sm md:text-base ${
                activeTab === "youtube"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              YouTube Link
            </button>
          </div>

          {activeTab === "upload" ? (
            <div className="space-y-6">
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile && validateFile(droppedFile)) {
                      setFile(droppedFile);
                      setFileError("");
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/5 transition-all animate-in fade-in duration-300"
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

              {fileError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {fileError}
                </div>
              )}

              <Button
                onClick={handleCreateFileClass}
                disabled={!file || submittingFile}
                className="w-full h-12 text-lg font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {submittingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Create Class
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Paste YouTube Link (https://www.youtube.com/watch?v=...)"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setVideoData(null);
                      setYoutubeError("");
                    }}
                    className="h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleVerifyYouTubeUrl}
                  disabled={!url || isLoadingMetadata}
                  className="h-12 px-6 font-medium bg-red-600 hover:bg-red-700 shrink-0"
                >
                  {isLoadingMetadata ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>

              {youtubeError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {youtubeError}
                </div>
              )}

              {videoData && (
                <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-850 animate-in fade-in zoom-in duration-300">
                  <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-24 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0 overflow-hidden relative shadow-sm">
                      <img
                        src={`https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`}
                        className="w-full h-full object-cover"
                        alt="Thumbnail"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {videoData.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDurationDisplay(videoData.duration)}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Topic Focus */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Course Title / Topic Focus
                      </label>
                      <Input
                        value={youtubeTopic}
                        onChange={(e) => setYoutubeTopic(e.target.value)}
                        placeholder="e.g. React Hook Basics"
                      />
                    </div>

                    {/* Target Language */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Tutor Explanation Language
                      </label>
                      <select
                        value={youtubeLanguage}
                        onChange={(e) => setYoutubeLanguage(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Yoruba">Yoruba</option>
                        <option value="Igbo">Igbo</option>
                        <option value="Hausa">Hausa</option>
                      </select>
                    </div>

                    {/* Pause Interval */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Pause & Explain Interval
                      </label>
                      <select
                        value={youtubeInterval}
                        onChange={(e) => setYoutubeInterval(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="30">Every 30 seconds</option>
                        <option value="60">Every 1 minute</option>
                        <option value="120">Every 2 minutes</option>
                        <option value="300">Every 5 minutes</option>
                      </select>
                    </div>

                    {/* Personality */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Tutor Personality
                      </label>
                      <select
                        value={youtubePersonality}
                        onChange={(e) => setYoutubePersonality(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="Ajibade">Ajibade (Active Lecturer)</option>
                        <option value="Encouraging">Encouraging (Warm)</option>
                        <option value="Strict">Strict Disciplinarian</option>
                        <option value="Casual">Casual Mentor</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateYouTubeClass}
                    disabled={submittingYoutube || !youtubeTopic.trim()}
                    className="w-full h-12 text-lg font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submittingYoutube ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating Class...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Generate YouTube Class
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
