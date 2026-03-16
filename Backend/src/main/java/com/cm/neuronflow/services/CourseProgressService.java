package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.CourseProgress;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.CourseProgressRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CourseProgressService {

    private final CourseProgressRepository courseProgressRepository;

    public CourseProgressService(CourseProgressRepository courseProgressRepository) {
        this.courseProgressRepository = courseProgressRepository;
    }

    public int getHighestCompletedOrder(String userId, Course course) {
        return courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .map(CourseProgress::getHighestCompletedOrder)
                .orElse(0);
    }

    public int getNextUnlockedOrder(String userId, Course course) {
        return getHighestCompletedOrder(userId, course) + 1;
    }

    public boolean isLessonUnlocked(String userId, Lesson lesson) {
        ensureCourseOwnership(userId, lesson.getCourse());
        int highestCompletedOrder = getHighestCompletedOrder(userId, lesson.getCourse());
        return lesson.getOrderIndex() <= highestCompletedOrder + 1;
    }

    public CourseProgress completeLesson(String userId, Lesson lesson) {
        Course course = lesson.getCourse();
        ensureCourseOwnership(userId, course);

        CourseProgress progress = courseProgressRepository
                .findByUserIdAndCourseId(userId, course.getId())
                .orElseGet(() -> CourseProgress.builder()
                        .userId(userId)
                        .course(course)
                        .highestCompletedOrder(0)
                        .build());

        int highestCompletedOrder = progress.getHighestCompletedOrder() == null
                ? 0
                : progress.getHighestCompletedOrder();

        if (lesson.getOrderIndex() > highestCompletedOrder + 1) {
            throw new NeuronFlowException(
                    "Lesson is locked. Please complete previous lessons first.",
                    HttpStatus.FORBIDDEN
            );
        }

        if (lesson.getOrderIndex() > highestCompletedOrder) {
            progress.setHighestCompletedOrder(lesson.getOrderIndex());
            progress = courseProgressRepository.save(progress);
        }

        return progress;
    }

    public void ensureCourseOwnership(String userId, Course course) {
        if (!course.getUserId().equals(userId)) {
            throw new NeuronFlowException("You are not authorized to access this course.", HttpStatus.FORBIDDEN);
        }
    }
}
