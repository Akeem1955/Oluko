import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'night-vision']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  avatar: z.string().url().optional(),
  preferences: UserPreferencesSchema,
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(['youtube', 'pdf', 'teach-me']),
  status: z.enum(['in-progress', 'completed', 'paused']),
  progress: z.number().min(0).max(100),
  title: z.string(),
  thumbnail: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
});

export const QuizAnswerSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answers: z.array(QuizAnswerSchema).min(2).max(4),
  explanation: z.string().optional(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type QuizAnswer = z.infer<typeof QuizAnswerSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
