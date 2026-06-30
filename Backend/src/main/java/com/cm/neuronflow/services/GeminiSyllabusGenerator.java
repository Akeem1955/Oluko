package com.cm.neuronflow.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import com.google.genai.types.Blob;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import static com.google.genai.types.Type.Known.ARRAY;
import static com.google.genai.types.Type.Known.OBJECT;
import static com.google.genai.types.Type.Known.STRING;

@Slf4j
@Service
public class GeminiSyllabusGenerator {

    private final Client geminiClient;
    private final ObjectMapper objectMapper;
    private static final String SYLLABUS_MODEL = "gemini-3.5-flash";

    public GeminiSyllabusGenerator(Client geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public String generateSyllabus(String topic, String contextMaterial, String targetLanguage) {
        log.info("Generating syllabus via Gemini 3.5 Flash for topic: {}", topic);
        try {
            Schema responseSchema = Schema.builder()
                    .type(OBJECT)
                    .properties(Map.of(
                            "lessons", Schema.builder()
                                    .type(ARRAY)
                                    .items(Schema.builder()
                                            .type(OBJECT)
                                            .properties(Map.of(
                                                    "title", Schema.builder().type(STRING).build(),
                                                    "objective", Schema.builder().type(STRING).build()
                                            ))
                                            .required("title", "objective")
                                            .build())
                                    .build()
                    ))
                    .required("lessons")
                    .build();

            Content systemInstruction = Content.fromParts(Part.fromText(
                    "You are an expert Instructional Designer. Create a highly structured course syllabus about the provided topic in " + targetLanguage + ". "
                    + "Generate a JSON object matching the provided schema. Return ONLY valid JSON."
            ));

            String userPrompt = String.format(
                    "Topic: %s\nContext Material:\n%s\n\nGenerate a list of lessons based on this topic and context. For each lesson, provide a title and a detailed objective.",
                    topic != null ? topic : "the provided document",
                    contextMaterial != null ? contextMaterial : "Use your general knowledge."
            );

            GenerateContentConfig config = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .responseMimeType("application/json")
                    .responseSchema(responseSchema)
                    .systemInstruction(systemInstruction)
                    .build();

            GenerateContentResponse response = geminiClient.models.generateContent(
                    SYLLABUS_MODEL,
                    userPrompt,
                    config
            );

            String jsonText = response.text();
            if (jsonText == null || jsonText.trim().isEmpty()) {
                throw new IllegalStateException("Empty syllabus response from Gemini");
            }

            // The calling class expects the exact JSON structure: [ { "title": "...", "objective": "..." } ]
            // So we parse and serialize the lessons list directly
            SyllabusWrapper wrapper = objectMapper.readValue(jsonText, SyllabusWrapper.class);
            return objectMapper.writeValueAsString(wrapper.getLessons());

        } catch (Exception e) {
            log.error("Failed to generate syllabus from Gemini", e);
            throw new RuntimeException(e);
        }
    }

    public String generateTopicContext(String topic, String targetLanguage) {
        log.info("Generating topic context via Gemini 3.5 Flash for topic: {}", topic);
        try {
            String prompt = String.format("""
                You are an expert educator. Generate comprehensive, factual reference material about '%s' in %s.
                
                Cover key concepts, definitions, examples, and important details that a tutor would need
                to teach this topic effectively. Be thorough and accurate.
                Do NOT generate a syllabus or lesson plan - generate the actual teaching content and knowledge.
                """, topic, targetLanguage);

            GenerateContentResponse response = geminiClient.models.generateContent(
                    SYLLABUS_MODEL,
                    prompt,
                    null
            );
            return response.text();
        } catch (Exception e) {
            log.error("Failed to generate topic context from Gemini", e);
            throw new RuntimeException(e);
        }
    }

    public String analyzeVideoContent(byte[] videoBytes, String targetLanguage) {
        log.info("Analyzing video content via Gemini 3.5 Flash");
        try {
            Part videoPart = Part.builder()
                    .inlineData(Blob.builder()
                            .mimeType("video/mp4")
                            .data(videoBytes)
                            .build())
                    .build();

            String prompt = String.format("""
                Analyze this video thoroughly in %s. Extract all educational content, key concepts,
                facts, explanations, and knowledge presented.
                
                Produce a comprehensive text summary that captures everything a tutor would need
                to teach the material covered in this video. Be detailed and accurate.
                """, targetLanguage);

            GenerateContentResponse response = geminiClient.models.generateContent(
                    SYLLABUS_MODEL,
                    Content.fromParts(videoPart, Part.fromText(prompt)),
                    null
            );
            return response.text();
        } catch (Exception e) {
            log.error("Failed to analyze video content from Gemini", e);
            throw new RuntimeException(e);
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class SyllabusWrapper {
        private List<Map<String, String>> lessons;
    }
}
