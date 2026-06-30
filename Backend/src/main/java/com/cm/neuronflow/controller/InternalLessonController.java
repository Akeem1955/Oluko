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

                    String personality = "Ajibade";
                    String intervalStr = "60";
                    boolean isYoutubeClass = false;
                    boolean isTeacherClass = false;
                    String voiceId = "";
                    String customPersona = "";

                    if (course.getTitle() != null && course.getTitle().startsWith("YOUTUBE_CLASS::")) {
                        isYoutubeClass = true;
                        String query = course.getTitle().substring("YOUTUBE_CLASS::".length());
                        String[] params = query.split("&");
                        for (String param : params) {
                            if (param.startsWith("personality=")) {
                                personality = param.substring(12);
                            } else if (param.startsWith("interval=")) {
                                intervalStr = param.substring(9);
                            }
                        }
                    } else if (course.getTitle() != null && course.getTitle().startsWith("TEACHER_CLASS::")) {
                        isTeacherClass = true;
                        String query = course.getTitle().substring("TEACHER_CLASS::".length());
                        String[] params = query.split("&");
                        for (String param : params) {
                            if (param.startsWith("voiceId=")) {
                                voiceId = param.substring(8);
                            } else if (param.startsWith("persona=")) {
                                try {
                                    customPersona = java.net.URLDecoder.decode(param.substring(8), java.nio.charset.StandardCharsets.UTF_8.name());
                                } catch (Exception e) {
                                    customPersona = param.substring(8);
                                }
                            }
                        }
                    }

                    String personalityInstructions = getPersonalityPrompt(personality);
                    if (isTeacherClass && !customPersona.isEmpty()) {
                        personalityInstructions = "PERSONALITY / SYSTEM ROLE:\n" + customPersona;
                    }

                    StringBuilder systemPromptBuilder = new StringBuilder();
                    systemPromptBuilder.append(String.format("""
                        You are Olùkọ́, an AI teacher giving lessons using voice. You have a virtual whiteboard tool called whiteboard_draw(react_code).
                        You must speak strictly in this language: %s.

                        YOUR CURRENT OBJECTIVE: Teach the user about '%s'.
                        LESSON DETAILS: %s

                        GROUND TRUTH CONTEXT (Do not hallucinate outside of this):
                        %s

                        **Rules:**
                        1. Speak naturally to the student. Explain concepts clearly in full sentences. Use examples, analogies, and step-by-step reasoning.
                        2. When illustrating concepts, **call whiteboard_draw() internally** with a single self-contained React functional component (JSX) called LessonVisualization.
                        3. The React component must use hooks (React.useState, React.useEffect, React.useRef) as React.useState, etc. Do not use imports or exports. End the code string with: render(<LessonVisualization />);
                        4. Leverage Tailwind CSS for responsive styling, custom SVG shapes, animated transitions, or interactive panels to make the lesson clear.
                        5. For math, display KaTeX formulas or beautifully formatted equations. For Python, you can render custom mock code editors or output execution displays. For vectors/physics, build interactive drag-and-drop elements or canvas elements using React hooks.
                        6. Always produce working, meaningful, interactive illustrations. The student should only hear your voice explanation; they never see the code or function call.
                        7. Separate your explanation from the visual: voice explains, canvas illustrates.
                        8. Never output raw React code to the student verbally, and never produce empty components.
                        9. Always use the whiteboard at the beginning of the session — render an initial visual before or alongside your first explanation.
                        10. Keep using whiteboard tools frequently for key concepts throughout the lesson.

                        LESSON CLOSURE:
                        - Only give a final conclusion when the lesson objective is fully taught.
                        - The conclusion must recap the key ideas clearly.
                        - If a final recap visual materially improves understanding, use a whiteboard tool for it.
                        - After a proper conclusion, call the tool end_session to end the session cleanly.
                        """,
                            course.getTargetLanguage(),
                            lesson.getTitle(),
                            lesson.getObjective(),
                            course.getSourceMaterial() != null && !course.getSourceMaterial().isBlank() ? course.getSourceMaterial() : "General Knowledge"
                    ));

                    systemPromptBuilder.append("\n").append(personalityInstructions);

                    if (isYoutubeClass) {
                        systemPromptBuilder.append(String.format("""

                            YOUTUBE MODALITY SPECIAL INSTRUCTIONS:
                            - This is a YouTube Video Class.
                            - The student is watching the video, and it will automatically pause at configured intervals (every %s seconds) to ask you to explain.
                            - When you receive a data channel message '{ "type": "VIDEO_EVENT", "event": "paused", "timestamp": X }', you must verbally explain the concepts covered in the video segment leading up to that timestamp.
                            - You have tools `play_video` and `pause_video` to control video playback.
                            - Once you have finished explaining the concept (and optional whiteboard visualization), call `play_video` to resume the video for the student.
                            - You do NOT need to run the standard 4 normal explanations -> 1 quiz loop for the video class, but you can choose to ask a quiz question if appropriate before resuming the video.
                            """, intervalStr));
                    } else if (isTeacherClass) {
                        systemPromptBuilder.append("""

                            TEACHER-LED CLASS SPECIAL INSTRUCTIONS:
                            - This is a Teacher-Led Class.
                            - The teacher is present in the room in GHOST MODE (observing and listening, but silent to the student).
                            - Your role is to teach the student, but be responsive to any instructions or questions the teacher sends you.
                            - If the teacher sends a command via the data channel (which you will hear or receive), acknowledge it and execute it.
                            - For example, if the teacher tells you to ask a specific question, stop your current explanation and ask that question immediately.
                            - Keep your explanations clear, structured, and interactive.
                            """);
                    } else {
                        systemPromptBuilder.append("""

                            CORE TEACHING & SESSION CONTROL LOOP (STOP-AND-GO):
                            - You must teach in repeating cycles: 4 concept explanations, then 1 quiz step.
                            - Pattern: 4 Normal explanations (explaining + using whiteboard_draw) -> 1 Quiz (using show_quiz_question) -> repeat.
                            - For each normal explanation, you should introduce a concept and call whiteboard_draw to illustrate it.
                            - After 4 such concept explanations, you must call show_quiz_question to ask a quiz question with options A, B, C, D and wait for the user to respond.
                            - A conclusion/wrap-up should only happen at the very end of the lesson, followed by calling end_session.
                            """);
                    }

                    if (!resumeContext.isEmpty()) {
                        systemPromptBuilder.append("\n").append(resumeContext);
                    }

                    Map<String, String> response = new HashMap<>();
                    response.put("systemPrompt", systemPromptBuilder.toString());
                    response.put("isTeacherClass", String.valueOf(isTeacherClass));
                    response.put("voiceId", voiceId);

                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String getPersonalityPrompt(String personality) {
        if ("Encouraging".equalsIgnoreCase(personality)) {
            return """
                PERSONALITY:
                You are an Encouraging, warm, and highly supportive AI tutor.
                Your tone is enthusiastic, patient, and full of praise.
                You focus on building the student's confidence, celebrating small wins,
                and using positive reinforcement. If the student struggles, offer guidance gently
                and motivate them to keep trying.
                """;
        } else if ("Strict".equalsIgnoreCase(personality)) {
            return """
                PERSONALITY:
                You are a Strict and highly disciplined AI tutor.
                Your tone is direct, serious, and focused on absolute precision.
                You set high expectations, correct errors immediately without sugarcoating,
                and push the student to explain concepts in detail. Keep them focused and on-task.
                """;
        } else if ("Casual".equalsIgnoreCase(personality)) {
            return """
                PERSONALITY:
                You are a Casual and friendly AI mentor.
                Your tone is relaxed, informal, and peer-like.
                Use everyday analogies, simple language, and speak like a friendly classmate.
                Keep the learning environment lighthearted and stress-free while still being educational.
                """;
        } else {
            // Default to Ajibade
            return """
                PERSONALITY:
                You are Ajibade, an "Active Lecturer" with formal authority and facilitative teaching.
                You are structured, professional, and explain concepts clearly, pacing yourself
                with the stop-and-go cycle (explaining, checking understanding, and then proceeding).
                """;
        }
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