// FILE: .\src\main\java\com\cm\neuronflow\controller\QuizController.java
package com.cm.neuronflow.controller;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.enums.CourseStatus;
import com.cm.neuronflow.internal.domain.enums.LearningMode;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.CourseRepository;
import com.cm.neuronflow.internal.repository.LessonRepository;
import com.cm.neuronflow.services.DocumentExtractionService;
import com.cm.neuronflow.services.NovaQuizGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
public class QuizController {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final DocumentExtractionService extractionService;
    private final NovaQuizGenerator novaQuizGenerator;

    public QuizController(CourseRepository courseRepository,
              LessonRepository lessonRepository,
                          DocumentExtractionService extractionService,
                          NovaQuizGenerator novaQuizGenerator) {
    this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.extractionService = extractionService;
        this.novaQuizGenerator = novaQuizGenerator;
    }

    @PostMapping("/generate-quiz-session")
    public ResponseEntity<Map<String, String>> generateStandaloneQuizSession(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "startPage", defaultValue = "1") int startPage,
        @RequestParam(value = "endPage", required = false) Integer endPage,
        @RequestParam(value = "targetLanguage", defaultValue = "English") String targetLanguage
    ) {

    try {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        int safeStart = Math.max(1, startPage);
        int safeEnd = endPage == null || endPage < safeStart ? safeStart : endPage;

        String targetedText = extractionService.extractSpecificPagesFromPdf(file.getBytes(), safeStart, safeEnd);
        String quizBank = novaQuizGenerator.generateQuizBank(targetedText);

        String objective = String.format(
            "You are now acting as a strict but encouraging Quizmaster. " +
                "Ask the user these questions one by one. Before asking each question, call the tool show_quiz_question with fields question, option_a, option_b, option_c, option_d based on the current quiz item. " +
                "Use the tool call in a non-blocking way and continue the quiz flow naturally. " +
                "Wait for the user's voice response, then evaluate it using the correct option from the quiz bank. " +
                "Do not reveal the correct answer before the user responds. " +
                "Evaluate their answer based on this ground truth:\n\n%s",
            quizBank
        );

        Course concentrationCourse = Course.builder()
            .userId(userId)
            .title("Concentration Quiz Session")
            .learningMode(LearningMode.DOCUMENT)
            .targetLanguage(targetLanguage)
            .status(CourseStatus.READY)
            .sourceMaterial(targetedText)
            .build();
        concentrationCourse = courseRepository.save(concentrationCourse);

        Lesson lesson = Lesson.builder()
            .course(concentrationCourse)
            .orderIndex(1)
            .title("Concentration Quiz")
            .objective(objective)
            .build();
        lesson = lessonRepository.save(lesson);

        return ResponseEntity.ok(Map.of(
            "message", "Quiz bank generated. Session is ready.",
            "lessonId", lesson.getId().toString()
        ));
    } catch (Exception e) {
        throw new NeuronFlowException("Failed to generate standalone quiz session: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
    }

    @PostMapping("/{lessonId}/generate-quiz")
    public ResponseEntity<Map<String, String>> generateQuizForLesson(
            @PathVariable UUID lessonId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("startPage") int startPage,
            @RequestParam("endPage") int endPage) {

        try {
            // 1. Get the existing lesson
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new NeuronFlowException("Lesson not found", HttpStatus.NOT_FOUND));

            // 2. Extract only the targeted pages
            String targetedText = extractionService.extractSpecificPagesFromPdf(file.getBytes(), startPage, endPage);

            // 3. Generate the Quiz Bank using Nova 2 Lite
            String quizBank = novaQuizGenerator.generateQuizBank(targetedText);

            // 4. Update the Lesson Objective so Sonic becomes the Quizmaster
            String newObjective = String.format(
                    "You are now acting as a strict but encouraging Quizmaster. " +
                        "Ask the user these questions one by one. Before asking each question, call the tool show_quiz_question with fields question, option_a, option_b, option_c, option_d based on the current quiz item. " +
                        "Use the tool call in a non-blocking way and continue the quiz flow naturally. " +
                        "Wait for the user's voice response, then evaluate it using the correct option from the quiz bank. " +
                        "Do not reveal the correct answer before the user responds. " +
                        "Evaluate their answer based on this ground truth:\n\n%s",
                    quizBank
            );

            lesson.setObjective(newObjective);
            lessonRepository.save(lesson);

            return ResponseEntity.ok(Map.of("message", "Quiz bank generated. Sonic is ready to test the user."));

        } catch (Exception e) {
            throw new NeuronFlowException("Failed to generate quiz: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}