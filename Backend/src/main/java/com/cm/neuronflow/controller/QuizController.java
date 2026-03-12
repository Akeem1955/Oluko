// FILE: .\src\main\java\com\cm\neuronflow\controller\QuizController.java
package com.cm.neuronflow.controller;

import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.LessonRepository;
import com.cm.neuronflow.services.DocumentExtractionService;
import com.cm.neuronflow.services.NovaQuizGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
public class QuizController {

    private final LessonRepository lessonRepository;
    private final DocumentExtractionService extractionService;
    private final NovaQuizGenerator novaQuizGenerator;

    public QuizController(LessonRepository lessonRepository,
                          DocumentExtractionService extractionService,
                          NovaQuizGenerator novaQuizGenerator) {
        this.lessonRepository = lessonRepository;
        this.extractionService = extractionService;
        this.novaQuizGenerator = novaQuizGenerator;
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
                            "Ask the user these questions one by one. Wait for their voice response. " +
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