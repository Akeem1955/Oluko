import { useRef, useEffect } from "react";

interface LessonVideoPlayerProps {
  videoId: string;
  playerRef: React.MutableRefObject<any>;
  onPlayerReady: () => void;
  onStateChange: (event: any) => void;
  clarificationResponse?: any;
  isPlaying: boolean;
  togglePlayback: (e?: React.MouseEvent) => void;
  timeUntilNextStep: number | null;
}

export function LessonVideoPlayer({
  videoId,
  playerRef,
  onPlayerReady,
  onStateChange,
  clarificationResponse,
  isPlaying,
  togglePlayback,
}: LessonVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (!containerRef.current) return;

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          rel: 0,
          disablekb: 1,
          modestbranding: 1,
          fs: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onStateChange,
        },
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [videoId, playerRef, onPlayerReady, onStateChange]);

  const PlayIcon = () => (
    <path
      fillRule="evenodd"
      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
      clipRule="evenodd"
    />
  );

  const PauseIcon = () => (
    <path
      fillRule="evenodd"
      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
      clipRule="evenodd"
    />
  );

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        id="youtube-player"
        className={`w-full h-full pointer-events-none ${clarificationResponse?.stepPayload?.canvasHtmlContent ? "hidden" : "block"}`}
      />

      {!clarificationResponse?.stepPayload?.canvasHtmlContent && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 transition-opacity duration-300 opacity-0 hover:opacity-100 peer-hover:opacity-100 group-hover:opacity-100 pointer-events-auto">
          <button
            onClick={togglePlayback}
            className="p-3 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-colors shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </svg>
          </button>
          <span className="text-white font-medium text-sm whitespace-nowrap">
            Toggle Playback
          </span>
        </div>
      )}
      <div
        className="absolute inset-0 z-20 group cursor-pointer"
        onClick={togglePlayback}
      />
    </div>
  );
}
