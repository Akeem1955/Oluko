import { useEffect, useState, useRef } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { useWhiteboardStore } from '@/lib/store/whiteboardStore';
import { WhiteboardPayload } from '@/lib/types';
import { CanvasRenderer } from './CanvasRenderer';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useClassById } from '@/lib/hooks/useClasses';
import { loadYouTubeAPI, extractYouTubeVideoId } from '@/lib/utils/youtube';

type QuizVisual = {
  question?: string;
  options?: Record<string, string>;
};

interface YouTubePlayerAreaProps {
  url: string;
  interval: number; // in seconds
  onPauseEvent: (currentTime: number) => void;
  controlMessage: { action: string; timestamp: number } | null;
}

function YouTubePlayerArea({
  url,
  interval,
  onPauseEvent,
  controlMessage,
}: YouTubePlayerAreaProps) {
  const videoId = extractYouTubeVideoId(url);
  const playerRef = useRef<any>(null);
  const containerId = 'youtube-player-frame';
  const lastPauseTimeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadYouTubeAPI().then(() => {
      if (!window.YT || !window.YT.Player) return;
      playerRef.current = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: videoId || '',
        playerVars: {
          playsinline: 1,
          controls: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
    }).catch((err) => console.error("Failed to load YouTube player API:", err));

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  // Handle play/pause commands from the agent
  useEffect(() => {
    if (!controlMessage || !playerRef.current) return;
    const { action } = controlMessage;
    try {
      if (action === 'play_video' && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      } else if (action === 'pause_video' && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error("Failed to control YouTube video:", e);
    }
  }, [controlMessage]);

  // Check playback time to pause at intervals
  useEffect(() => {
    if (interval <= 0) return;

    const checkTime = () => {
      if (!playerRef.current || !playerRef.current.getCurrentTime || !isPlaying) return;
      try {
        const currentTime = playerRef.current.getCurrentTime();
        // Reset last pause point if student scrubs back or jumps ahead significantly
        if (currentTime < lastPauseTimeRef.current || Math.abs(currentTime - lastPauseTimeRef.current) > interval + 5) {
          lastPauseTimeRef.current = currentTime;
        }

        const elapsedSinceLastPause = currentTime - lastPauseTimeRef.current;
        if (elapsedSinceLastPause >= interval) {
          playerRef.current.pauseVideo();
          lastPauseTimeRef.current = currentTime;
          onPauseEvent(currentTime);
        }
      } catch (e) {
        // Safe catch if API not fully ready
      }
    };

    const intervalId = setInterval(checkTime, 500);
    return () => clearInterval(intervalId);
  }, [interval, isPlaying, onPauseEvent]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
      <div id={containerId} className="w-full h-full animate-in fade-in duration-300" />
    </div>
  );
}

/**
 * Interactive Whiteboard component.
 * Lives inside a <LiveKitRoom> and listens for data channel payloads
 * from the Python AI agent containing images or React canvas code.
 */
export function InteractiveWhiteboard() {
  const { visualMode, visualData, loadingText, handlePayload, reset } =
    useWhiteboardStore();

  const [controlMessage, setControlMessage] = useState<{ action: string; timestamp: number } | null>(null);

  // Fetch course settings to check for YouTube modality
  const courseId = localStorage.getItem("currentCourseId");
  const { data: course } = useClassById(courseId);
  const isYouTubeClass = course?.title?.startsWith("YOUTUBE_CLASS::") || false;

  const youtubeSettings = (() => {
    if (!course || !course.title.startsWith("YOUTUBE_CLASS::")) return null;
    try {
      const query = course.title.substring("YOUTUBE_CLASS::".length);
      const params = new URLSearchParams(query);
      return {
        url: params.get("url") || "",
        interval: parseInt(params.get("interval") || "60", 10),
        personality: params.get("personality") || "Ajibade",
        topic: params.get("topic") || "",
      };
    } catch (e) {
      console.error("Failed to parse YouTube settings:", e);
      return null;
    }
  })();

  const parsedQuiz: QuizVisual | null = (() => {
    if (visualMode !== 'quiz' || !visualData) return null;
    try {
      return JSON.parse(visualData) as QuizVisual;
    } catch {
      return null;
    }
  })();

  // Listen for data channel messages from the AI agent
  const { send } = useDataChannel((msg) => {
    try {
      const payloadStr = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(payloadStr);

      if (data.type === 'CONTROL_ACTION' && (data.action === 'play_video' || data.action === 'pause_video')) {
        setControlMessage({ action: data.action, timestamp: Date.now() });
      } else {
        handlePayload(data as WhiteboardPayload);
      }
    } catch (e) {
      console.error('Failed to parse whiteboard data channel message:', e);
    }
  });

  const handleSandboxError = (errorMsg: string) => {
    console.error('Sandbox rendering error:', errorMsg);
    if (!send) return;
    try {
      const payload = JSON.stringify({
        type: 'SANDBOX_ERROR',
        message: errorMsg,
      });
      send(new TextEncoder().encode(payload), { reliable: true });
    } catch (e) {
      console.error('Failed to send sandbox error payload:', e);
    }
  };

  const sendPauseEvent = (currentTime: number) => {
    if (!send) return;
    try {
      const payload = JSON.stringify({
        type: 'VIDEO_EVENT',
        event: 'paused',
        timestamp: Math.round(currentTime),
      });
      send(new TextEncoder().encode(payload), { reliable: true });
    } catch (e) {
      console.error('Failed to send video pause event payload:', e);
    }
  };

  // Reset whiteboard state on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const renderStandardContent = () => {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden rounded-lg">
        {visualMode === 'idle' && (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-slate-300 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">Whiteboard ready</p>
            <p className="text-xs">
              The AI will draw here when explaining concepts
            </p>
          </div>
        )}

        {visualMode === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {loadingText}
            </p>
          </div>
        )}

        {visualMode === 'image' && (
          <img
            src={visualData}
            alt="AI Generated Visual"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        )}

        {visualMode === 'canvas' && (
          <CanvasRenderer codeString={visualData} onError={handleSandboxError} />
        )}

        {visualMode === 'quiz' && (
          <div className="w-full h-full flex items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5 md:p-7 space-y-5">
              <div className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                Concentration Quiz
              </div>

              <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {parsedQuiz?.question || 'Quiz question unavailable.'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(parsedQuiz?.options || {}) as Array<[string, string]>).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
                  >
                    <p className="text-sm md:text-base text-slate-700 dark:text-slate-200">
                      <span className="font-bold mr-2">{key}.</span>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {visualMode === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 text-center px-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {loadingText}
            </p>
            <button
              onClick={reset}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isYouTubeClass && youtubeSettings) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row relative bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Left pane: YouTube player */}
        <div className="w-full md:w-1/2 h-[45vh] md:h-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center">
          <YouTubePlayerArea
            url={youtubeSettings.url}
            interval={youtubeSettings.interval}
            onPauseEvent={sendPauseEvent}
            controlMessage={controlMessage}
          />
        </div>
        {/* Right pane: Standard whiteboard/drawings/quizzes */}
        <div className="w-full md:w-1/2 h-[55vh] md:h-full relative">
          {renderStandardContent()}
        </div>
      </div>
    );
  }

  return renderStandardContent();
}
