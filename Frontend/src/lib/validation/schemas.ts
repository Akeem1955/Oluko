import { z } from 'zod';

export const SignupSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const OtpSchema = z.object({
    otp: z.string().length(8, 'OTP must be 8 digits'),
    email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const VerifyResetPasswordSchema = z.object({
    otp: z.string().length(8, 'OTP must be 8 digits'),
    email: z.string().email('Invalid email address'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateProfileSchema = z.object({
    base64Image: z.string().optional(),
    weeklyGoalHours: z.number().min(1).max(168).optional(),
});

export const CreateTopicClassSchema = z.object({
    topic: z.string().min(3, 'Topic must be at least 3 characters'),
});

export const CreateYoutubeClassSchema = z.object({
    youtubeUrl: z.string().url('Invalid YouTube URL'),
    videoDurationSeconds: z.number().min(60, 'Video must be at least 1 minute'),
});

export const StartLessonSchema = z.object({
    classId: z.number(),
    unitIndex: z.number().min(0).optional(),
});

export type SignupRequest = z.infer<typeof SignupSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type OtpRequest = z.infer<typeof OtpSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type VerifyResetPasswordRequest = z.infer<typeof VerifyResetPasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type CreateTopicClassRequest = z.infer<typeof CreateTopicClassSchema>;
export type CreateYoutubeClassRequest = z.infer<typeof CreateYoutubeClassSchema>;
export type StartLessonRequest = z.infer<typeof StartLessonSchema>;
