import { useQuery } from "@tanstack/react-query";
import { classService } from "@/lib/services/classService";

const queryKeys = {
  all: ["courses"] as const,
  lists: () => [...queryKeys.all, "list"] as const,
  list: (type: string) => [...queryKeys.lists(), type] as const,
  details: () => [...queryKeys.all, "detail"] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  lessons: (courseId: string) => ["courses", courseId, "lessons"] as const,
};

export const useClasses = () => {
  return useQuery({
    queryKey: queryKeys.list("all"),
    queryFn: classService.getCourses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useRecentClasses = () => {
  return useQuery({
    queryKey: queryKeys.list("recent"),
    queryFn: classService.getRecentCourses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useClassById = (id: string | null) => {
  return useQuery({
    queryKey: queryKeys.detail(id!),
    queryFn: () => classService.getCourseById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCourseLessons = (courseId: string | null) => {
  return useQuery({
    queryKey: queryKeys.lessons(courseId!),
    queryFn: () => classService.getCourseLessons(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
};
