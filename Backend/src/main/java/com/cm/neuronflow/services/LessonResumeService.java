package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.LessonResumeState;
import com.cm.neuronflow.internal.repository.LessonResumeStateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.*;

import java.util.Optional;

@Service
public class LessonResumeService {

    private static final String NOVA_PRO_MODEL_ID = "us.amazon.nova-pro-v1:0";

    private final LessonResumeStateRepository lessonResumeStateRepository;
    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;

    public LessonResumeService(
            LessonResumeStateRepository lessonResumeStateRepository,
            BedrockRuntimeClient bedrockClient,
            ObjectMapper objectMapper
    ) {
        this.lessonResumeStateRepository = lessonResumeStateRepository;
        this.bedrockClient = bedrockClient;
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

    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    protected ResumeEvaluation evaluateTranscript(Lesson lesson, String transcript) {
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
                Return ONLY JSON with this exact schema:
                {
                  "completionPercent": number between 0 and 100,
                  "resumeSummary": "short summary of what has been covered and what to continue with next",
                  "completed": true|false
                }
                """, lesson.getTitle(), lesson.getObjective(), transcript);

            Message message = Message.builder()
                    .role(ConversationRole.USER)
                    .content(ContentBlock.fromText(prompt))
                    .build();

            ConverseRequest request = ConverseRequest.builder()
                    .modelId(NOVA_PRO_MODEL_ID)
                    .messages(message)
                    .build();

            ConverseResponse response = bedrockClient.converse(request);
            String raw = response.output().message().content().get(0).text().trim();

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
