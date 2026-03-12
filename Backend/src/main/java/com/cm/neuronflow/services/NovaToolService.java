package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class NovaToolService {

    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, Object> redisTemplate; // Reusing your existing Redis config

    // Keep canvas as us. cross-region, and update Lite
    private static final String NOVA_CANVAS_MODEL_ID = "us.amazon.nova-canvas-v1:0";
    private static final String NOVA_LITE_MODEL_ID = "us.amazon.nova-2-lite-v1:0";

    public NovaToolService(BedrockRuntimeClient bedrockClient, ObjectMapper objectMapper, RedisTemplate<String, Object> redisTemplate) {
        this.bedrockClient = bedrockClient;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 1. Generates an Image using Nova Canvas, saves Base64 to Redis, returns UUID.
     */
    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    public String generateAndCacheImage(String prompt) {
        try {
            // Construct the exact JSON payload for Amazon Nova Canvas
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("taskType", "TEXT_IMAGE");
            payload.putObject("textToImageParams").put("text", prompt);
            ObjectNode config = payload.putObject("imageGenerationConfig");
            config.put("numberOfImages", 1);
            config.put("quality", "standard");
            config.put("height", 1024);
            config.put("width", 1024);
            config.put("cfgScale", 8.0);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(NOVA_CANVAS_MODEL_ID)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(payload.toString()))
                    .build();

            InvokeModelResponse response = bedrockClient.invokeModel(request);
            JsonNode responseNode = objectMapper.readTree(response.body().asUtf8String());

            // Extract the Base64 image string
            String base64Image = responseNode.get("images").get(0).asText();

            // Cache in Redis for 2 Hours
            String imageId = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set("whiteboard_image:" + imageId, base64Image, Duration.ofHours(2));

            return imageId;

        } catch (Exception e) {
            throw new NeuronFlowException("Failed to generate image with Nova Canvas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 2. Generates React UI Code using Nova 2 Lite
     */
    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    public Map<String, String> generateCanvasCodeWithDescription(String prompt) {
        String systemInstruction = """
            You are an expert React developer building interactive educational visualizations for a tutoring app.
            
            You must return your answer in EXACTLY this format — two sections separated by the marker ===WALKTHROUGH===
            
            SECTION 1 (code): Raw executable JSX code. No markdown. No ```.
            ===WALKTHROUGH===
            SECTION 2 (walkthrough): 2-3 sentences describing what the visualization shows and how the student should interact with it (e.g. "Click the Next Step button to step through each line of code. The memory panel on the right updates as variables are created."). Write from the perspective of a teacher guiding a student.
            
            CODE RULES:
            - Write a single self-contained React functional component.
            - The component must be the LAST expression (do NOT use export, do NOT assign it to a variable at the end).
            - Tailwind CSS is available — use it for styling.
            - React hooks (useState, useEffect, useRef, useCallback, useMemo) are available in scope — do NOT import them.
            - Do NOT import React or any libraries. They are already in scope.
            - For math/physics topics: embed a <canvas> element and use the HTML5 Canvas 2D API (ctx = canvas.getContext('2d'), requestAnimationFrame) inside useEffect/useRef for animations.
            - For coding/history/general topics: use div/svg layouts, animated lists, step-by-step walkthroughs with useState.
            - Make it interactive: add buttons, sliders (input type=range), or click handlers where it adds educational value.
            - Do NOT use JSX fragments (<> </>) at the top level — always return a single root element.
            """;

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText("Create an interactive React educational visualization for: " + prompt))
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(NOVA_LITE_MODEL_ID)
                .system(SystemContentBlock.builder().text(systemInstruction).build())
                .messages(message)
                .build();

        try {
            ConverseResponse response = bedrockClient.converse(request);
            String raw = response.output().message().content().get(0).text().trim();

            // Split into code and walkthrough
            String code;
            String walkthrough;
            if (raw.contains("===WALKTHROUGH===")) {
                String[] parts = raw.split("===WALKTHROUGH===", 2);
                code = parts[0].trim();
                walkthrough = parts[1].trim();
            } else {
                code = raw;
                walkthrough = "An interactive visualization about " + prompt + " is now on your whiteboard. Explore the controls to learn more.";
            }

            // Safety clean: Remove markdown if the model hallucinates it
            if (code.startsWith("```")) {
                code = code.replaceAll("^```[a-zA-Z]*\n", "").replaceAll("\n```$", "");
            }

            return Map.of("code", code, "walkthrough", walkthrough);
        } catch (Exception e) {
            throw new NeuronFlowException("Failed to generate UI code with Nova Lite: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}