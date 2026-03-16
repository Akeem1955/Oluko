// FILE: .\src\main\java\com\cm\neuronflow\controller\InternalLessonController.java
package com.cm.neuronflow.controller;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.LessonResumeState;
import com.cm.neuronflow.internal.domain.StudyAnalytics;
import com.cm.neuronflow.internal.dto.LessonSessionTranscriptRequest;
import com.cm.neuronflow.internal.repository.LessonRepository;
import com.cm.neuronflow.services.CourseProgressService;
import com.cm.neuronflow.services.LessonResumeService;
import com.cm.neuronflow.services.StudyAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal/lessons")
public class InternalLessonController {

    private final LessonRepository lessonRepository;
    private final LessonResumeService lessonResumeService;
    private final StudyAnalyticsService studyAnalyticsService;
    private final CourseProgressService courseProgressService;

    public InternalLessonController(
            LessonRepository lessonRepository,
            LessonResumeService lessonResumeService,
            StudyAnalyticsService studyAnalyticsService,
            CourseProgressService courseProgressService
    ) {
        this.lessonRepository = lessonRepository;
        this.lessonResumeService = lessonResumeService;
        this.studyAnalyticsService = studyAnalyticsService;
        this.courseProgressService = courseProgressService;
    }

    @GetMapping("/{id}/prompt")
    public ResponseEntity<Map<String, String>> getLessonPrompt(@PathVariable UUID id) {
        return lessonRepository.findById(id)
                .map(lesson -> {
                    Course course = lesson.getCourse();
                    LessonResumeState resumeState = lessonResumeService
                            .getByLessonId(lesson.getId())
                            .orElse(null);

                    String resumeContext = "";
                    if (resumeState != null
                            && resumeState.getCompletionPercent() != null
                            && resumeState.getCompletionPercent() > 0
                            && resumeState.getCompletionPercent() < 100) {
                        resumeContext = String.format("""

                            RESUME CONTEXT:
                            - This is a resumed lesson session.
                            - Previous estimated completion: %d%%.
                            - What has already been taught: %s
                            - Continue from this point instead of starting from scratch.
                            """, resumeState.getCompletionPercent(), resumeState.getResumeSummary());
                    }

                    String systemPrompt = String.format("""
                        You are NeuronFlow, an AI conversational tutor. 
                        You must speak strictly in this language: %s.
                        
                        YOUR CURRENT OBJECTIVE: Teach the user about '%s'.
                        LESSON DETAILS: %s
                        
                        GROUND TRUTH CONTEXT (Do not hallucinate outside of this): 
                        %s
                        
                        INSTRUCTIONS:
                        Be concise. Engage the user. Ask them questions.
                        Always use the whiteboard at the beginning of the session.
                        - In your first teaching turn, call a whiteboard tool before or alongside your explanation.
                        - Prefer draw_canvas_code for concept teaching visuals.
                        - Use insert_image when a static reference image is more appropriate.
                        After the first whiteboard action, keep using whiteboard tools frequently for key concepts.
                        When calling draw_canvas_code, always provide:
                        - prompt_for_nova: the concept to visualize
                        - interactivity_description: explicit interactions (buttons/sliders/toggles/steps) the learner should use

                        SPEAKING + WHITEBOARD SYNCHRONIZATION:
                        - Your speech and whiteboard must describe the same teaching moment.
                        - If you draw or display a visual, explicitly reference it while speaking.
                        - Keep narration aligned to what is currently visible on the whiteboard.

                        LESSON CLOSURE:
                        - Only give a final conclusion when the lesson objective is fully taught.
                        - The conclusion must recap the key ideas clearly.
                        - If a final recap visual materially improves understanding, use a whiteboard tool for it.
                        - After a proper conclusion, call the tool end_session to end the session cleanly.
                        %s
                        """,
                            course.getTargetLanguage(),
                            lesson.getTitle(),
                            lesson.getObjective(),
                            course.getSourceMaterial() != null && !course.getSourceMaterial().isBlank() ? course.getSourceMaterial() : "General Knowledge",
                            resumeContext
                    );

                    return ResponseEntity.ok(Map.of("systemPrompt", systemPrompt));
                })
                .orElse(ResponseEntity.notFound().build());
    }

            @PostMapping("/{id}/session-transcript")
            public ResponseEntity<Map<String, Object>> persistSessionTranscript(
                @PathVariable UUID id,
                @RequestBody LessonSessionTranscriptRequest request
            ) {
            return lessonRepository.findById(id)
                .map(lesson -> {
                    boolean endedByAgent = Boolean.TRUE.equals(request.getEndedByAgent());
                    String transcript = request.getTranscript() == null ? "" : request.getTranscript();
                    String shutdownReason = request.getShutdownReason() == null ? "" : request.getShutdownReason();

                    LessonResumeState state = lessonResumeService.persistTranscript(
                        lesson,
                        transcript,
                        endedByAgent,
                        shutdownReason
                    );

                    StudyAnalytics analytics = null;
                    if (endedByAgent) {
                        courseProgressService.completeLesson(lesson.getCourse().getUserId(), lesson);
                        analytics = studyAnalyticsService.saveCompletionAnalytics(lesson, transcript);
                    }

                        Map<String, Object> response = new HashMap<>();
                        response.put("completionPercent", state.getCompletionPercent());
                        response.put("isCompleted", state.getIsCompleted());
                        response.put("resumeSummary", state.getResumeSummary() == null ? "" : state.getResumeSummary());
                        response.put("analyticsId", analytics != null ? analytics.getId().toString() : "");

                        return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
            }
}