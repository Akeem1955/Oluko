// FILE: .\src\main\java\com\cm\neuronflow\services\NovaQuizGenerator.java
package com.cm.neuronflow.services;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.*;

@Service
public class NovaQuizGenerator {

    private final BedrockRuntimeClient bedrockClient;

    private static final String NOVA_LITE_MODEL_ID = "us.amazon.nova-2-lite-v1:0";

    public NovaQuizGenerator(BedrockRuntimeClient bedrockClient) {
        this.bedrockClient = bedrockClient;
    }

    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    public String generateQuizBank(String contextMaterial) {
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

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText(prompt))
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(NOVA_LITE_MODEL_ID)
                .messages(message)
                .build();

        ConverseResponse response = bedrockClient.converse(request);
        return response.output().message().content().get(0).text().trim();
    }
}