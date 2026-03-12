import { motion } from 'framer-motion';

/**
 * Visual feedback component that shows expanding circles
 * when the AI agent is speaking via the LiveKit room.
 */
export function AgentVisualizer({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer expanding rings */}
        {isSpeaking && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/10"
              animate={{ scale: [1, 2.6], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
            />
          </>
        )}

        {/* Core circle */}
        <motion.div
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30"
          animate={
            isSpeaking
              ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 rgba(37,99,235,0.3)', '0 0 20px 8px rgba(37,99,235,0.15)', '0 0 0 0 rgba(37,99,235,0.3)'] }
              : { scale: 1 }
          }
          transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
        >
          {/* Waveform bars inside */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-white rounded-full"
                animate={
                  isSpeaking
                    ? { height: [6, 16 + Math.random() * 8, 6] }
                    : { height: 4 }
                }
                transition={{
                  duration: 0.5,
                  repeat: isSpeaking ? Infinity : 0,
                  delay: i * 0.08,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
