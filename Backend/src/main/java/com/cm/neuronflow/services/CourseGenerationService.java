package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.enums.CourseStatus;
import com.cm.neuronflow.internal.domain.enums.LearningMode;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class CourseGenerationService {

    private static final int MAX_COURSES_PER_USER = 10;

    private final CourseRepository courseRepository;
    private final CourseGenerationAsyncWorker asyncWorker;

    public CourseGenerationService(CourseRepository courseRepository, CourseGenerationAsyncWorker asyncWorker) {
        this.courseRepository = courseRepository;
        this.asyncWorker = asyncWorker;
    }

    public Course initializeAndStartGeneration(String userId, LearningMode learningMode, String targetLanguage, String topic, MultipartFile file) {

        // Enforce per-user course limit
        long courseCount = courseRepository.countByUserId(userId);
        if (courseCount >= MAX_COURSES_PER_USER) {
            throw new NeuronFlowException(
                    "You've reached the maximum of " + MAX_COURSES_PER_USER + " courses. Please delete an existing course before creating a new one.",
                    HttpStatus.FORBIDDEN);
        }

        byte[] fileBytes = null;
        String title = topic;

        // 1. Safely extract bytes from the MultipartFile synchronously
        if (file != null && !file.isEmpty()) {
            try {
                fileBytes = file.getBytes();
                if (title == null || title.isBlank()) {
                    title = "Course from " + file.getOriginalFilename();
                }
            } catch (IOException e) {
                throw new NeuronFlowException("Failed to read the uploaded file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        } else if (learningMode == LearningMode.DOCUMENT || learningMode == LearningMode.VIDEO) {
            throw new NeuronFlowException("A file must be provided for " + learningMode + " mode.", HttpStatus.BAD_REQUEST);
        } else if (title == null || title.isBlank()) {
            throw new NeuronFlowException("A topic must be provided for TOPIC mode.", HttpStatus.BAD_REQUEST);
        }

        // 2. Create and save the initial Course entity (Status: PENDING)
        Course course = Course.builder()
                .userId(userId)
                .title(title)
                .learningMode(learningMode)
                .targetLanguage(targetLanguage)
                .status(CourseStatus.PENDING)
                .build();

        course = courseRepository.save(course);

        // 3. Hand off the byte array to the Async Worker
        // We pass bytes, NOT the MultipartFile, because Spring destroys MultipartFiles after the HTTP response returns!
        asyncWorker.processCourseGeneration(course.getId(), fileBytes, topic);

        // 4. Return immediately to the Controller so the frontend can start polling
        return course;
    }

    // This is used by the Controller to poll for the "READY" status
    public Course getCourseById(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new NeuronFlowException("Course not found with ID: " + courseId, HttpStatus.NOT_FOUND));
    }

    // Get all courses for a user, ordered by most recent first
    public List<Course> getUserCourses(String userId) {
        return courseRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Get the 5 most recent courses for a user
    public List<Course> getRecentUserCourses(String userId) {
        return courseRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
    }
}