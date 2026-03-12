import { LessonVideoPlayer } from "./LessonVideoPlayer";
import { useIsMobile } from "@/lib/hooks/activity/useMediaQuery";
import { cn } from "@/lib/utils/utils";

interface LessonContentAreaProps {
  isYouTubeMode: boolean;
  isPlaying: boolean;
  clarificationResponse: any;
  currentStep: any;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  togglePlayback: (e?: React.MouseEvent) => void;
  videoId: string;
  playerRef: React.MutableRefObject<any>;
  onPlayerReady: () => void;
  onStateChange: (event: any) => void;
  isQuizActive: boolean;
  isCurrentlyPausing: boolean;
  manualChatEnabled: boolean;
  isQuizFinished: boolean;
  currentQuizIndex: number;
  selectedAnswerIndex: number | null;
  isShowingFeedback: boolean;
  quizScore: number;
  handleQuizOptionClick: (option: string, index: number) => void;
  handlePostQuizResponse: (hasQuestion: boolean) => void;
  setIsQuizActive: (active: boolean) => void;
  timeUntilNextStep: number | null;
  isAudioFinished: boolean;
  isTutorSpeaking: boolean;
}

export function LessonContentArea({
  isYouTubeMode,
  isPlaying,
  clarificationResponse,
  currentStep,
  iframeRef,
  togglePlayback,
  videoId,
  playerRef,
  onPlayerReady,
  onStateChange,
  isQuizActive,
  isCurrentlyPausing,
  manualChatEnabled,
  isQuizFinished,
  currentQuizIndex,
  selectedAnswerIndex,
  isShowingFeedback,
  quizScore,
  handleQuizOptionClick,
  handlePostQuizResponse,
  setIsQuizActive,
  timeUntilNextStep,
  isAudioFinished,
  isTutorSpeaking,
}: LessonContentAreaProps) {
  const isMobile = useIsMobile();

  return (
    <div className="w-full lg:flex-1 flex-1 lg:h-full bg-slate-100 dark:bg-slate-900 relative order-1 lg:order-1 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
      {isYouTubeMode && (
        <LessonVideoPlayer
          videoId={videoId}
          playerRef={playerRef}
          onPlayerReady={onPlayerReady}
          onStateChange={onStateChange}
          clarificationResponse={clarificationResponse}
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          timeUntilNextStep={timeUntilNextStep}
        />
      )}

      {(!isYouTubeMode ||
        clarificationResponse?.stepPayload?.canvasHtmlContent) && (
        <div className="w-full h-full overflow-hidden relative">
          <iframe
            key={(clarificationResponse || currentStep)?.id}
            ref={iframeRef}
            title="Interactive Sandbox"
            sandbox="allow-scripts allow-same-origin"
            className={cn(
              "border-0 absolute top-0 left-0 transition-transform duration-300",
              isMobile
                ? "w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[0.66]"
                : "w-full h-full top-0 left-0",
            )}
          />
        </div>
      )}

      {isQuizActive &&
        isAudioFinished &&
        !isTutorSpeaking &&
        (!isYouTubeMode || isCurrentlyPausing) &&
        !manualChatEnabled &&
        currentStep?.stepPayload?.quizzesJson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
              {!isQuizFinished ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                      Question {currentQuizIndex + 1}{" "}
                      <span className="text-slate-400 font-normal text-sm">
                        of {currentStep.stepPayload.quizzesJson.length}
                      </span>
                    </h3>
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                          width: `${((currentQuizIndex + 1) / currentStep.stepPayload.quizzesJson.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 font-medium leading-relaxed">
                    {
                      currentStep.stepPayload.quizzesJson[currentQuizIndex]
                        .question
                    }
                  </p>
                  <div className="space-y-3">
                    {currentStep.stepPayload.quizzesJson[
                      currentQuizIndex
                    ].options.map((option: string, idx: number) => {
                      const quiz =
                        currentStep.stepPayload?.quizzesJson?.[
                          currentQuizIndex
                        ];
                      const isCorrect = idx === quiz?.correctAnswerIndex;
                      const isSelected = idx === selectedAnswerIndex;
                      let buttonClass =
                        "border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10";
                      if (isShowingFeedback) {
                        if (isCorrect)
                          buttonClass =
                            "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                        else if (isSelected)
                          buttonClass =
                            "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                        else
                          buttonClass =
                            "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50";
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizOptionClick(option, idx)}
                          disabled={isShowingFeedback}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium group flex items-center justify-between ${buttonClass}`}
                        >
                          <span>{option}</span>
                          <div className="flex items-center gap-2">
                            {isShowingFeedback && isCorrect && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4.13-5.69z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {isShowingFeedback && isSelected && !isCorrect && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5 text-red-500 animate-in zoom-in duration-300"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {!isShowingFeedback && (
                              <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary flex items-center justify-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-10 h-10 text-emerald-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.23z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Quiz Completed!
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-lg leading-relaxed">
                    You scored{" "}
                    <span className="text-emerald-500 font-bold">
                      {quizScore}
                    </span>{" "}
                    out of {currentStep?.stepPayload?.quizzesJson?.length || 0}.{" "}
                    {quizScore ===
                    (currentStep?.stepPayload?.quizzesJson?.length || 0)
                      ? "Great job!"
                      : "Keep practicing!"}
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-8 border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-4">
                      Do you have any questions about this topic before we move
                      on?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setIsQuizActive(false);
                          handlePostQuizResponse(false);
                        }}
                        className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-all"
                      >
                        No, Continue
                      </button>
                      <button
                        onClick={() => {
                          setIsQuizActive(false);
                          handlePostQuizResponse(true);
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        I have a question
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {!isYouTubeMode && !currentStep?.stepPayload?.canvasHtmlContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
