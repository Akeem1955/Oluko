package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.StudyAnalytics;
import com.cm.neuronflow.internal.domain.enums.AnalyticsType;
import com.cm.neuronflow.internal.dto.StudyAnalyticsItemDTO;
import com.cm.neuronflow.internal.dto.StudyAnalyticsOverviewDTO;
import com.cm.neuronflow.internal.repository.StudyAnalyticsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.*;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class StudyAnalyticsService {

    private static final String NOVA_PRO_MODEL_ID = "us.amazon.nova-pro-v1:0";

    private final StudyAnalyticsRepository studyAnalyticsRepository;
    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;

    public StudyAnalyticsService(
            StudyAnalyticsRepository studyAnalyticsRepository,
            BedrockRuntimeClient bedrockClient,
            ObjectMapper objectMapper
    ) {
        this.studyAnalyticsRepository = studyAnalyticsRepository;
        this.bedrockClient = bedrockClient;
        this.objectMapper = objectMapper;
    }

    public StudyAnalytics saveCompletionAnalytics(Lesson lesson, String transcript) {
        String safeTranscript = transcript == null ? "" : transcript.trim();
        if (safeTranscript.isBlank()) {
            return null;
        }

        AnalyticsType analyticsType = inferAnalyticsType(lesson);
        AnalyticsEvaluation evaluation = evaluateTranscript(lesson, safeTranscript, analyticsType);

        StudyAnalytics analytics = StudyAnalytics.builder()
                .lesson(lesson)
                .userId(lesson.getCourse().getUserId())
                .analyticsType(analyticsType)
                .masteryScore(evaluation.masteryScore())
                .clarityScore(evaluation.clarityScore())
                .retentionScore(evaluation.retentionScore())
                .quizAccuracy(analyticsType == AnalyticsType.QUIZ ? evaluation.quizAccuracy() : null)
                .strengths(String.join("\n", evaluation.strengths()))
                .weakAreas(String.join("\n", evaluation.weakAreas()))
                .recommendation(evaluation.recommendation())
                .transcriptExcerpt(safeTranscript.length() > 4000 ? safeTranscript.substring(0, 4000) : safeTranscript)
                .build();

        return studyAnalyticsRepository.save(analytics);
    }

    public StudyAnalyticsOverviewDTO getOverviewForUser(String userId) {
        List<StudyAnalytics> recent = studyAnalyticsRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);

        int total = recent.size();
        int quizSessions = (int) recent.stream().filter(item -> item.getAnalyticsType() == AnalyticsType.QUIZ).count();
        int lessonSessions = total - quizSessions;

        int avgMastery = total == 0
                ? 0
                : (int) Math.round(recent.stream().mapToInt(item -> safeScore(item.getMasteryScore())).average().orElse(0));

        List<StudyAnalytics> quizOnly = recent.stream()
                .filter(item -> item.getAnalyticsType() == AnalyticsType.QUIZ)
                .collect(Collectors.toList());
        int avgQuizAccuracy = quizOnly.isEmpty()
                ? 0
                : (int) Math.round(quizOnly.stream().mapToInt(item -> safeScore(item.getQuizAccuracy())).average().orElse(0));

        List<StudyAnalyticsItemDTO> sessions = recent.stream().map(item -> StudyAnalyticsItemDTO.builder()
                .id(item.getId().toString())
                .type(item.getAnalyticsType().name())
                .lessonTitle(item.getLesson().getTitle())
                .masteryScore(item.getMasteryScore())
                .clarityScore(item.getClarityScore())
                .retentionScore(item.getRetentionScore())
                .quizAccuracy(item.getQuizAccuracy())
                .strengths(item.getStrengths())
                .weakAreas(item.getWeakAreas())
                .recommendation(item.getRecommendation())
                .createdAt(item.getCreatedAt())
                .build()).collect(Collectors.toList());

        return StudyAnalyticsOverviewDTO.builder()
                .totalSessions(total)
                .quizSessions(quizSessions)
                .lessonSessions(lessonSessions)
                .avgMasteryScore(avgMastery)
                .avgQuizAccuracy(avgQuizAccuracy)
                .recentSessions(sessions)
                .build();
    }

    private int safeScore(Integer value) {
        return Math.max(0, Math.min(100, value == null ? 0 : value));
    }

    private AnalyticsType inferAnalyticsType(Lesson lesson) {
        String title = lesson.getTitle() == null ? "" : lesson.getTitle().toLowerCase(Locale.ROOT);
        String objective = lesson.getObjective() == null ? "" : lesson.getObjective().toLowerCase(Locale.ROOT);
        if (title.contains("quiz") || objective.contains("quizmaster")) {
            return AnalyticsType.QUIZ;
        }
        return AnalyticsType.LESSON;
    }

    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    protected AnalyticsEvaluation evaluateTranscript(Lesson lesson, String transcript, AnalyticsType analyticsType) {
        try {
            String prompt = String.format("""
                You are an expert learning analytics evaluator.

                SESSION TYPE: %s
                LESSON TITLE: %s
                LESSON OBJECTIVE: %s

                SESSION TRANSCRIPT:
                %s

                Return ONLY valid JSON with this schema:
                {
                  "masteryScore": 0-100,
                  "clarityScore": 0-100,
                  "retentionScore": 0-100,
                  "quizAccuracy": 0-100,
                  "strengths": ["short bullet", "..."],
                  "weakAreas": ["short bullet", "..."],
                  "recommendation": "one concise next-step recommendation"
                }

                If SESSION TYPE is LESSON and quizAccuracy is not applicable, set quizAccuracy to 0.
                """, analyticsType.name(), lesson.getTitle(), lesson.getObjective(), transcript);

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

            int mastery = clamp(node.path("masteryScore").asInt(0));
            int clarity = clamp(node.path("clarityScore").asInt(0));
            int retention = clamp(node.path("retentionScore").asInt(0));
            int accuracy = clamp(node.path("quizAccuracy").asInt(0));

            List<String> strengths = toList(node.path("strengths"));
            List<String> weakAreas = toList(node.path("weakAreas"));
            String recommendation = node.path("recommendation").asText("Continue with a short review and then practice with one more focused question set.");

            return new AnalyticsEvaluation(mastery, clarity, retention, accuracy, strengths, weakAreas, recommendation);
        } catch (Exception e) {
            return new AnalyticsEvaluation(
                    analyticsType == AnalyticsType.QUIZ ? 70 : 75,
                    70,
                    68,
                    analyticsType == AnalyticsType.QUIZ ? 65 : 0,
                    List.of("Stayed engaged through the session."),
                    List.of("Needs targeted revision on weaker concepts."),
                    "Review weak areas and take one short follow-up practice session."
            );
        }
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private List<String> toList(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return List.of();
        }
        if (node.isArray()) {
            return streamArray(node);
        }
        String text = node.asText("").trim();
        if (text.isBlank()) {
            return List.of();
        }
        return Arrays.stream(text.split("[\\n,]+"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(6)
                .collect(Collectors.toList());
    }

    private List<String> streamArray(JsonNode node) {
        return java.util.stream.StreamSupport.stream(node.spliterator(), false)
                .map(JsonNode::asText)
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(6)
                .collect(Collectors.toList());
    }

    public record AnalyticsEvaluation(
            int masteryScore,
            int clarityScore,
            int retentionScore,
            int quizAccuracy,
            List<String> strengths,
            List<String> weakAreas,
            String recommendation
    ) {
    }
}
