import { useEffect } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { useWhiteboardStore } from '@/lib/store/whiteboardStore';
import { WhiteboardPayload } from '@/lib/types';
import { CanvasRenderer } from './CanvasRenderer';
import { Loader2, AlertTriangle } from 'lucide-react';

type QuizVisual = {
  question?: string;
  options?: Record<string, string>;
};

/**
 * Interactive Whiteboard component.
 * Lives inside a <LiveKitRoom> and listens for data channel payloads
 * from the Python AI agent containing images or React canvas code.
 */
export function InteractiveWhiteboard() {
  const { visualMode, visualData, loadingText, handlePayload, reset } =
    useWhiteboardStore();

  const parsedQuiz: QuizVisual | null = (() => {
    if (visualMode !== 'quiz' || !visualData) return null;
    try {
      return JSON.parse(visualData) as QuizVisual;
    } catch {
      return null;
    }
  })();

  // Listen for data channel messages from the AI agent
  useDataChannel((msg) => {
    try {
      const payloadStr = new TextDecoder().decode(msg.payload);
      const data: WhiteboardPayload = JSON.parse(payloadStr);
      handlePayload(data);
    } catch (e) {
      console.error('Failed to parse whiteboard data channel message:', e);
    }
  });

  // Reset whiteboard state on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <div className="whiteboard-container w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden rounded-lg">
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
        <CanvasRenderer codeString={visualData} />
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
}
