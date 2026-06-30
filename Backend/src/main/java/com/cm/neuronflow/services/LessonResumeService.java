package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.LessonResumeState;
import com.cm.neuronflow.internal.repository.LessonResumeStateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

import static com.google.genai.types.Type.Known.OBJECT;
import static com.google.genai.types.Type.Known.STRING;
import static com.google.genai.types.Type.Known.INTEGER;
import static com.google.genai.types.Type.Known.BOOLEAN;

@Slf4j
@Service
public class LessonResumeService {

    private static final String MODEL_ID = "gemini-3.5-flash";

    private final LessonResumeStateRepository lessonResumeStateRepository;
    private final Client geminiClient;
    private final ObjectMapper objectMapper;

    public LessonResumeService(
            LessonResumeStateRepository lessonResumeStateRepository,
            Client geminiClient,
            ObjectMapper objectMapper
    ) {
        this.lessonResumeStateRepository = lessonResumeStateRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public Optional<LessonResumeState> getByLessonId(java.util.UUID lessonId) {
        return lessonResumeStateRepository.findByLessonId(lessonId);
    }

    public LessonResumeState persistTranscript(
            Lesson lesson,
            String transcript,
            boolean endedByAgent,
            String shutdownReason
    ) {
        LessonResumeState state = lessonResumeStateRepository.findByLessonId(lesson.getId())
                .orElseGet(() -> LessonResumeState.builder()
                        .lesson(lesson)
                        .completionPercent(0)
                        .isCompleted(false)
                        .resumeSummary("")
                        .lastTranscript("")
                        .build());

        String safeTranscript = transcript == null ? "" : transcript.trim();

        if (endedByAgent) {
            state.setCompletionPercent(100);
            state.setIsCompleted(true);
            state.setResumeSummary("Lesson completed successfully.");
            state.setLastTranscript(safeTranscript);
            state.setLastShutdownReason(shutdownReason);
            return lessonResumeStateRepository.save(state);
        }

        if (safeTranscript.isBlank()) {
            state.setLastShutdownReason(shutdownReason);
            return lessonResumeStateRepository.save(state);
        }

        ResumeEvaluation evaluation = evaluateTranscript(lesson, safeTranscript);
        state.setCompletionPercent(evaluation.completionPercent());
        state.setIsCompleted(evaluation.completionPercent() >= 100 || evaluation.completed());
        state.setResumeSummary(evaluation.resumeSummary());
        state.setLastTranscript(safeTranscript);
        state.setLastShutdownReason(shutdownReason);

        return lessonResumeStateRepository.save(state);
    }

    protected ResumeEvaluation evaluateTranscript(Lesson lesson, String transcript) {
        log.info("Evaluating lesson progress via Gemini 3.5 Flash for Lesson ID: {}", lesson.getId());
        try {
            String prompt = String.format("""
                You are an expert lesson progress evaluator.
                
                LESSON TITLE:
                %s
                
                LESSON OBJECTIVE:
                %s
                
                TAUGHT TRANSCRIPT:
                %s
                
                Decide how much of the lesson objective has been taught.
                """, lesson.getTitle(), lesson.getObjective(), transcript);

            Schema responseSchema = Schema.builder()
                    .type(OBJECT)
                    .properties(Map.of(
                            "completionPercent", Schema.builder().type(INTEGER).build(),
                            "resumeSummary", Schema.builder().type(STRING).build(),
                            "completed", Schema.builder().type(BOOLEAN).build()
                    ))
                    .required("completionPercent", "resumeSummary", "completed")
                    .build();

            GenerateContentConfig config = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .responseMimeType("application/json")
                    .responseSchema(responseSchema)
                    .build();

            GenerateContentResponse response = geminiClient.models.generateContent(
                    MODEL_ID,
                    prompt,
                    config
                );
            String raw = response.text().trim();

            int jsonStart = raw.indexOf('{');
            int jsonEnd = raw.lastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                raw = raw.substring(jsonStart, jsonEnd + 1);
            }

            JsonNode node = objectMapper.readTree(raw);
            int percent = node.path("completionPercent").asInt(0);
            percent = Math.max(0, Math.min(100, percent));

            String summary = node.path("resumeSummary").asText("Continue from the latest taught point.");
            boolean completed = node.path("completed").asBoolean(false);

            return new ResumeEvaluation(percent, summary, completed);
        } catch (Exception e) {
            log.error("Failed to evaluate transcript using Gemini", e);
            return new ResumeEvaluation(
                    15,
                    "Session ended before completion. Continue from the latest discussed concepts.",
                    false
            );
        }
    }

    public record ResumeEvaluation(int completionPercent, String resumeSummary, boolean completed) {
    }
}
