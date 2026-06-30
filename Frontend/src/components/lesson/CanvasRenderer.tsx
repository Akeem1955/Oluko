import { useEffect, useContext } from 'react';
import { LiveProvider, LivePreview, LiveError, LiveContext } from 'react-live';
import * as React from 'react';

interface CanvasRendererProps {
  codeString: string;
  onError?: (error: string) => void;
}

function ErrorMonitor({ onError }: { onError?: (error: string) => void }) {
  const { error } = useContext(LiveContext);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return null;
}

export function CanvasRenderer({ codeString, onError }: CanvasRendererProps) {
  // Sanitize: strip markdown fences if the model wraps them
  let code = (codeString || '').trim();
  code = code
    .replace(/^```(?:jsx|tsx|js|javascript)?\s*/g, '')
    .replace(/```\s*$/g, '');

  // Safety net: Auto-append render call if missing but component is defined
  if (!code.includes('render(') && code.includes('LessonVisualization')) {
    code += '\nrender(<LessonVisualization />);';
  }

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-auto bg-slate-900 rounded-lg text-slate-100 min-h-[300px]">
      <LiveProvider code={code} noInline={true} scope={{ React }}>
        <ErrorMonitor onError={onError} />
        <div className="flex-1 w-full h-full flex items-center justify-center">
          <LivePreview className="w-full h-full flex items-center justify-center" />
        </div>
        <LiveError className="mt-2 text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/50 font-mono whitespace-pre-wrap" />
      </LiveProvider>
    </div>
  );
}
