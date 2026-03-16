package com.cm.neuronflow.controller;



import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.enums.LearningMode;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.LessonRepository;
import com.cm.neuronflow.services.CourseProgressService;
import com.cm.neuronflow.services.CourseGenerationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseGenerationController {

    private final CourseGenerationService courseGenerationService;
    private final LessonRepository lessonRepository;
    private final CourseProgressService courseProgressService;

    public CourseGenerationController(
            CourseGenerationService courseGenerationService,
            LessonRepository lessonRepository,
            CourseProgressService courseProgressService
    ) {
        this.courseGenerationService = courseGenerationService;
        this.lessonRepository = lessonRepository;
        this.courseProgressService = courseProgressService;
    }

    /**
     * 1. The Trigger: Starts the Async Generation Process
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateCourse(
            @RequestParam("learningMode") LearningMode learningMode,
            @RequestParam("targetLanguage") String targetLanguage,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Immediate return: Course is saved as PENDING/GENERATING
        Course course = courseGenerationService.initializeAndStartGeneration(userId, learningMode, targetLanguage, topic, file);

        return ResponseEntity.accepted().body(Map.of(
                "courseId", course.getId(),
                "status", course.getStatus(),
                "message", "Course generation started asynchronously."
        ));
    }

    /**
     * 2. The Polling: Frontend checks this to update the Shimmering Card
     */
    @GetMapping("/{courseId}/status")
    public ResponseEntity<Map<String, String>> getCourseStatus(@PathVariable UUID courseId) {
        Course course = courseGenerationService.getCourseById(courseId);

        return ResponseEntity.ok(Map.of(
                "courseId", course.getId().toString(),
                "status", course.getStatus().name(),
                "title", course.getTitle()
        ));
    }

    /**
     * 3. The Retrieval: Frontend loads the Syllabus when status is READY
     */
    @GetMapping("/{courseId}/lessons")
    public ResponseEntity<List<Lesson>> getCourseLessons(@PathVariable UUID courseId) {
        Course course = courseGenerationService.getCourseById(courseId);

        if (!course.getStatus().name().equals("READY")) {
            throw new NeuronFlowException("Course is not ready yet.", HttpStatus.BAD_REQUEST);
        }

        return ResponseEntity.ok(course.getLessons());
    }

    /**
     * 4. List all courses for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Course>> getUserCourses() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(courseGenerationService.getUserCourses(userId));
    }

    /**
     * 5. Get the 5 most recent courses for the authenticated user
     */
    @GetMapping("/recent")
    public ResponseEntity<List<Course>> getRecentCourses() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(courseGenerationService.getRecentUserCourses(userId));
    }

    /**
     * 6. Get a single course by ID
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<Course> getCourseById(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseGenerationService.getCourseById(courseId));
    }

    /**
     * 7. Get sequential lesson progress for a course.
     */
    @GetMapping("/{courseId}/progress")
    public ResponseEntity<Map<String, Integer>> getCourseProgress(@PathVariable UUID courseId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        Course course = courseGenerationService.getCourseById(courseId);
        courseProgressService.ensureCourseOwnership(userId, course);

        int highestCompletedOrder = courseProgressService.getHighestCompletedOrder(userId, course);
        return ResponseEntity.ok(Map.of(
                "highestCompletedOrder", highestCompletedOrder,
                "nextUnlockedOrder", highestCompletedOrder + 1
        ));
    }

    /**
     * 8. Mark a lesson as completed for sequential unlocking.
     */
    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<Map<String, Integer>> completeLesson(
            @PathVariable UUID courseId,
            @PathVariable UUID lessonId
    ) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        Course course = courseGenerationService.getCourseById(courseId);
        courseProgressService.ensureCourseOwnership(userId, course);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NeuronFlowException("Lesson not found", HttpStatus.NOT_FOUND));

        if (!lesson.getCourse().getId().equals(courseId)) {
            throw new NeuronFlowException("Lesson does not belong to this course", HttpStatus.BAD_REQUEST);
        }

        int highestCompletedOrder = courseProgressService
                .completeLesson(userId, lesson)
                .getHighestCompletedOrder();

        return ResponseEntity.ok(Map.of(
                "highestCompletedOrder", highestCompletedOrder,
                "nextUnlockedOrder", highestCompletedOrder + 1
        ));
    }
}
