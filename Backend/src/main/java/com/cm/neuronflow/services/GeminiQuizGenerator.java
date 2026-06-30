package com.cm.neuronflow.services;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GeminiQuizGenerator {

    private final Client geminiClient;
    private static final String MODEL_ID = "gemini-3.5-flash";

    public GeminiQuizGenerator(Client geminiClient) {
        this.geminiClient = geminiClient;
    }

    @Retry(name = "geminiApi")
    @CircuitBreaker(name = "geminiApi")
    public String generateQuizBank(String contextMaterial) {
        log.info("Generating quiz bank via Gemini 3.5 Flash");
        try {
            String prompt = String.format("""
                You are an expert examiner. Based strictly on the text below, generate a 'Quiz Bank' containing 3 to 5 challenging multiple-choice questions.

                TEXT TO TEST:
                %s

                RULES:
                - Each question must have exactly four options: A, B, C, D.
                - Exactly one option is correct.
                - Keep options plausible but only one correct.
                - Do not include explanations.

                Format each item exactly as:
                Q1: [Question]
                A) [Option A]
                B) [Option B]
                C) [Option C]
                D) [Option D]
                ANSWER: [A|B|C|D]

                Repeat for Q2, Q3, etc.
                """, contextMaterial);

            GenerateContentResponse response = geminiClient.models.generateContent(
                    MODEL_ID,
                    prompt,
                    null
            );
            return response.text().trim();
        } catch (Exception e) {
            log.error("Failed to generate quiz bank from Gemini", e);
            throw new RuntimeException(e);
        }
    }
}
