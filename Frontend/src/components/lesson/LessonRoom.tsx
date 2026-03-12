import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useConnectionState,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { ConnectionState } from 'livekit-client';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLivekitToken } from '@/lib/hooks/activity/useLivekitToken';
import { AgentVisualizer } from './AgentVisualizer';
import { InteractiveWhiteboard } from './InteractiveWhiteboard';
import { ConfirmDialog } from '@/components/dialog/ConfirmDialog';

interface LessonRoomProps {
  lessonId: string;
  lessonTitle?: string;
}

/**
 * Inner component that has access to the LiveKit room context.
 * Must be rendered inside <LiveKitRoom>.
 */
function LessonRoomContent({ lessonTitle }: { lessonTitle?: string }) {
  const voiceAssistant = useVoiceAssistant();
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  // The agent is speaking when its state is 'speaking'
  const isSpeaking = voiceAssistant.state === 'speaking';

  return (
    <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Main content area — Interactive Whiteboard */}
      <div className="w-full lg:flex-1 flex-1 lg:h-full relative order-1 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
        <InteractiveWhiteboard />
      </div>

      {/* Right panel — Agent Visualizer + Status */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-slate-900/95 backdrop-blur-xl border-l border-white/10 order-2">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-slate-900/80 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight">
                Olùkọ́ Tutor
              </h3>
              <p className="text-xs text-slate-400">
                {isConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}
            />
          </div>
        </div>

        {/* Agent Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <AgentVisualizer isSpeaking={isSpeaking} />

          <div className="text-center space-y-2">
            <p className="text-white font-semibold text-lg">
              {isSpeaking ? 'Tutor is speaking...' : 'Listening...'}
            </p>
            {lessonTitle && (
              <p className="text-slate-400 text-sm">{lessonTitle}</p>
            )}
            <p className="text-slate-500 text-xs mt-4">
              Your microphone is active. Just speak naturally.
            </p>
          </div>
        </div>
      </div>

      {/* Plays the AI agent's audio */}
      <RoomAudioRenderer />
    </div>
  );
}

/**
 * LessonRoom — Wraps the LiveKit room connection.
 * Fetches a secure token from the Java backend,
 * then mounts the LiveKitRoom context provider.
 */
export function LessonRoom({ lessonId, lessonTitle }: LessonRoomProps) {
  const navigate = useNavigate();
  const { token, livekitUrl, isLoading, error, fetchToken } = useLivekitToken();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    fetchToken(lessonId);
  }, [lessonId, fetchToken]);

  const handleBackClick = () => setShowExitDialog(true);
  const handleConfirmExit = () => {
    setShowExitDialog(false);
    navigate('/classes', { replace: true });
  };

  // Loading state
  if (isLoading || (!token && !error)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Connecting to class...</h2>
          <p className="text-slate-400">Setting up your voice session</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4 max-w-md p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-white">Connection Failed</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => fetchToken(lessonId)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background-light dark:bg-slate-950 overflow-hidden">
      <ConfirmDialog
        isOpen={showExitDialog}
        title="Leave Class?"
        message="Are you sure you want to leave? The voice session will end."
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitDialog(false)}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium text-sm hidden sm:inline">Leave Class</span>
        </button>
        <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
          {lessonTitle || 'Live Class'}
        </h1>
        <div />
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={livekitUrl!}
        token={token!}
        connect={true}
        audio={true}
        className="flex-1 flex flex-col"
      >
        <LessonRoomContent lessonTitle={lessonTitle} />
      </LiveKitRoom>
    </div>
  );
}
