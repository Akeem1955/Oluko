import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Music,
  FileText,
  AlertCircle,
  X,
  Volume2,
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastStore } from "@/lib/store/toastStore";
import { courseService } from "@/lib/services/courseService";
import { useCourseGenerationStore } from "@/lib/store/courseGenerationStore";
import apiClient from "@/lib/services/apiClient";

export default function TeacherSetup() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const startPolling = useCourseGenerationStore((s) => s.startPolling);

  // Form states
  const [classTitle, setClassTitle] = useState("");
  const [language, setLanguage] = useState("English");
  const [persona, setPersona] = useState(
    "You are a friendly and encouraging teacher who explains concepts step-by-step with real-world examples."
  );

  // File states
  const [docFile, setDocFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  // API and status states
  const [clonedVoiceId, setClonedVoiceId] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const docInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        addToast("Please upload a valid PDF file.", "error");
        setDocFile(null);
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        addToast("PDF file size must be less than 20MB.", "error");
        setDocFile(null);
        return;
      }
      setDocFile(selectedFile);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/m4a"];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".mp3") && !selectedFile.name.endsWith(".wav")) {
        addToast("Please upload a valid audio sample (MP3 or WAV).", "error");
        setVoiceFile(null);
        return;
      }
      if (selectedFile.size > 15 * 1024 * 1024) {
        addToast("Audio sample must be less than 15MB.", "error");
        setVoiceFile(null);
        return;
      }
      setVoiceFile(selectedFile);
    }
  };

  const handleCloneVoice = async () => {
    if (!voiceFile || !classTitle.trim()) {
      addToast("Please specify a class title and upload an audio sample first.", "warning");
      return;
    }

    setIsCloning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", `${classTitle.trim()} Voice`);
      formData.append("file", voiceFile);

      const res = await apiClient.post<{ voiceId: string }>(
        "/api/v1/elevenlabs/clone-voice",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setClonedVoiceId(res.data.voiceId);
      addToast("Voice cloned successfully via ElevenLabs!", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to clone voice.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setIsCloning(false);
    }
  };

  const handleCreateClass = async () => {
    if (!classTitle.trim()) {
      addToast("Please specify a class title.", "warning");
      return;
    }
    if (!clonedVoiceId) {
      addToast("Please clone your voice before creating the class.", "warning");
      return;
    }

    setIsCreating(true);
    try {
      // Build serialized TEACHER_CLASS title query string
      const topicQuery = `TEACHER_CLASS::title=${encodeURIComponent(classTitle.trim())}&voiceId=${clonedVoiceId}&persona=${encodeURIComponent(persona.trim())}&language=${encodeURIComponent(language)}`;

      const formData = new FormData();
      formData.append("learningMode", "DOCUMENT");
      formData.append("targetLanguage", language);
      formData.append("topic", topicQuery);
      if (docFile) {
        formData.append("file", docFile);
      }

      const res = await courseService.generate(formData);
      startPolling(res.courseId, classTitle.trim());
      addToast("Class created successfully! Starting course generation...", "success");
      navigate("/classes");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create teacher class.";
      addToast(msg, "error");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      <div className="p-4 md:p-6 max-w-[1440px] w-full mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800/80 w-full"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Users className="w-10 h-10 text-rose-600 dark:text-rose-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Teacher Mode Setup
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Prepare a private classroom for your students. Clone your voice using ElevenLabs, upload training materials, and customize your teaching persona.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details & Persona */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-rose-600 dark:text-rose-400">
                1. Class Details
              </h2>
              
              <div>
                <label className="block text-sm font-bold mb-2">Class Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Introduction to Physics"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Yoruba">Yoruba</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-1.5">
                  AI Teaching Persona
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe how the AI should behave and teach..."
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Right Column: Files & Actions */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-rose-600 dark:text-rose-400">
                2. Voice & Materials
              </h2>

              {/* ElevenLabs Voice Upload */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center justify-between">
                  <span>Voice Sample (MP3/WAV)</span>
                  {clonedVoiceId && (
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> Cloned
                    </span>
                  )}
                </label>
                
                {!voiceFile ? (
                  <div
                    onClick={() => voiceInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition-all text-center"
                  >
                    <input
                      type="file"
                      ref={voiceInputRef}
                      onChange={handleVoiceChange}
                      accept=".mp3,.wav"
                      className="hidden"
                    />
                    <Music className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium">Select your voice recording</p>
                    <p className="text-xs text-slate-400">Clean 10s-30s sample (Max 15MB)</p>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/15 rounded-xl border border-rose-100 dark:border-rose-950/30 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Music className="w-5 h-5 text-rose-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-bold truncate">{voiceFile.name}</p>
                        <p className="text-xs text-slate-400">{(voiceFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!clonedVoiceId && (
                        <button
                          onClick={handleCloneVoice}
                          disabled={isCloning}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isCloning ? "Cloning..." : "Clone"}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setVoiceFile(null);
                          setClonedVoiceId("");
                        }}
                        className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Class PDF Material */}
              <div>
                <label className="block text-sm font-bold mb-2">Class Material (PDF - Optional)</label>
                {!docFile ? (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 transition-all text-center"
                  >
                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={handleDocChange}
                      accept=".pdf"
                      className="hidden"
                    />
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium">Upload lecture notes/PDFs</p>
                    <p className="text-xs text-slate-400">PDF documents only (Max 20MB)</p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/15 rounded-xl border border-emerald-100 dark:border-emerald-950/30 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-bold truncate">{docFile.name}</p>
                        <p className="text-xs text-slate-400">{(docFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDocFile(null)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-950/30">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <Info className="w-6 h-6 text-rose-500 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Ghost Mode enabled automatically:</strong> As the teacher, your microphone publishes to the classroom so the AI assistant can listen and follow commands. However, student client interfaces automatically mute your audio track so students only hear the AI.
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleCreateClass}
              disabled={isCreating || !clonedVoiceId || !classTitle.trim()}
              className="w-full md:w-auto h-12 px-8 text-lg font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-lg shadow-rose-600/20"
            >
              {isCreating ? "Generating Class..." : "Create Teacher Class"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
