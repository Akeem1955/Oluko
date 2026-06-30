import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
}

export function formatCourseTitle(title: string): string {
  if (title && title.startsWith("YOUTUBE_CLASS::")) {
    try {
      const query = title.substring("YOUTUBE_CLASS::".length);
      const params = new URLSearchParams(query);
      const topic = params.get("topic");
      return topic ? `${decodeURIComponent(topic)} (YouTube)` : "YouTube Class";
    } catch (e) {
      return "YouTube Class";
    }
  } else if (title && title.startsWith("TEACHER_CLASS::")) {
    try {
      const query = title.substring("TEACHER_CLASS::".length);
      const params = new URLSearchParams(query);
      const classTitle = params.get("title");
      return classTitle ? `${decodeURIComponent(classTitle)} (Live Class)` : "Live Class";
    } catch (e) {
      return "Live Class";
    }
  }
  return title;
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
