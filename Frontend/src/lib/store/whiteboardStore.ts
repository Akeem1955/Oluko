import { create } from 'zustand';
import { VisualMode, WhiteboardPayload } from '@/lib/types';

interface WhiteboardState {
  visualMode: VisualMode;
  visualData: string;
  loadingText: string;
  setVisual: (mode: VisualMode, data?: string) => void;
  setLoading: (text?: string) => void;
  handlePayload: (payload: WhiteboardPayload) => void;
  reset: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  visualMode: 'idle',
  visualData: '',
  loadingText: 'AI is drawing...',

  setVisual: (mode, data = '') =>
    set({ visualMode: mode, visualData: data }),

  setLoading: (text = 'AI is drawing...') =>
    set({ visualMode: 'loading', loadingText: text }),

  handlePayload: (payload) => {
    if (payload.type === 'TOOL_PROCESSING') {
      set({
        visualMode: 'loading',
        loadingText: payload.message || 'AI is generating...',
      });
    } else if (payload.type === 'TOOL_CALL_RESULT') {
      if (payload.action === 'image') {
        set({ visualMode: 'image', visualData: payload.url || '' });
      } else if (payload.action === 'canvas') {
        set({ visualMode: 'canvas', visualData: payload.payload || '' });
      } else if (payload.action === 'quiz') {
        set({ visualMode: 'quiz', visualData: payload.payload || '' });
      }
    } else if (payload.type === 'TOOL_ERROR') {
      set({
        visualMode: 'error',
        loadingText: payload.message || 'Something went wrong.',
      });
    }
  },

  reset: () =>
    set({ visualMode: 'idle', visualData: '', loadingText: 'AI is drawing...' }),
}));
