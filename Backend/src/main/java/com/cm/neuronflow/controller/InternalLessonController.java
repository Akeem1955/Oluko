// FILE: .\src\main\java\com\cm\neuronflow\controller\InternalLessonController.java
package com.cm.neuronflow.controller;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.repository.LessonRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal/lessons")
public class InternalLessonController {

    private final LessonRepository lessonRepository;

    public InternalLessonController(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    @GetMapping("/{id}/prompt")
    public ResponseEntity<Map<String, String>> getLessonPrompt(@PathVariable UUID id) {
        return lessonRepository.findById(id)
                .map(lesson -> {
                    Course course = lesson.getCourse();

                    String systemPrompt = String.format("""
                        You are NeuronFlow, an AI conversational tutor. 
                        You must speak strictly in this language: %s.
                        
                        YOUR CURRENT OBJECTIVE: Teach the user about '%s'.
                        LESSON DETAILS: %s
                        
                        GROUND TRUTH CONTEXT (Do not hallucinate outside of this): 
                        %s
                        
                        INSTRUCTIONS:
                        Be concise. Engage the user. Ask them questions.
                        If you need to show them a visual, use your provided tools to control their whiteboard.
                        """,
                            course.getTargetLanguage(),
                            lesson.getTitle(),
                            lesson.getObjective(),
                            course.getSourceMaterial() != null && !course.getSourceMaterial().isBlank() ? course.getSourceMaterial() : "General Knowledge"
                    );

                    return ResponseEntity.ok(Map.of("systemPrompt", systemPrompt));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}