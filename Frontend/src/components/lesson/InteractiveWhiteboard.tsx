import { useEffect } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { useWhiteboardStore } from '@/lib/store/whiteboardStore';
import { WhiteboardPayload } from '@/lib/types';
import { CanvasRenderer } from './CanvasRenderer';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Interactive Whiteboard component.
 * Lives inside a <LiveKitRoom> and listens for data channel payloads
 * from the Python AI agent containing images or React canvas code.
 */
export function InteractiveWhiteboard() {
  const { visualMode, visualData, loadingText, handlePayload, reset } =
    useWhiteboardStore();

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
