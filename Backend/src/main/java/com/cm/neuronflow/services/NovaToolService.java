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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Map;
import java.util.UUID;

@Service
public class NovaToolService {

    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, Object> redisTemplate; // Reusing your existing Redis config

    // Use Titan Image Generator G1 v2 for whiteboard image generation
    private static final String TITAN_IMAGE_MODEL_ID = "amazon.titan-image-generator-v2:0";
    private static final String NOVA_PREMIER_MODEL_ID = "us.amazon.nova-premier-v1:0";
    private static final Pattern FENCED_CODE_BLOCK_PATTERN = Pattern.compile("```(?:jsx|javascript|js)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern WALKTHROUGH_HEADER_PATTERN = Pattern.compile("(?im)^#{1,6}\\s*walkthrough\\s*$");
    private static final Pattern COMPONENT_START_PATTERN = Pattern.compile("(?m)^(function\\s+[A-Z]\\w*\\s*\\(|const\\s+[A-Z]\\w*\\s*=\\s*\\(|class\\s+[A-Z]\\w*\\s+extends\\s+React\\.Component)");

    public NovaToolService(BedrockRuntimeClient bedrockClient, ObjectMapper objectMapper, RedisTemplate<String, Object> redisTemplate) {
        this.bedrockClient = bedrockClient;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    /**
    * 1. Generates an image using Titan Image Generator G1 v2,
    *    saves Base64 to Redis, and returns UUID.
     */
    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    public String generateAndCacheImage(String prompt) {
        try {
            // Construct payload for Amazon Titan Image Generator
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("taskType", "TEXT_IMAGE");
            payload.putObject("textToImageParams").put("text", prompt);
            ObjectNode config = payload.putObject("imageGenerationConfig");
            config.put("numberOfImages", 1);
            config.put("height", 1024);
            config.put("width", 1024);
            config.put("cfgScale", 8.0);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(TITAN_IMAGE_MODEL_ID)
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
            throw new NeuronFlowException("Failed to generate image with Titan Image Generator G1 v2: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
    * 2. Generates React UI Code using Nova Premier
     */
    @Retry(name = "bedrockApi")
    @CircuitBreaker(name = "bedrockApi")
    public Map<String, String> generateCanvasCodeWithDescription(String prompt, String interactivityDescription) {
        String systemInstruction = """
            You are an expert React developer building interactive educational visualizations for an AI tutoring platform.

            Your code will be executed automatically in a React Live environment.
            If the code contains syntax errors, the lesson will fail.

            Return ONLY valid JSON with this exact schema:
            {
              "code": "Raw executable JSX string for React Live",
              "walkthrough": "2-3 teacher-style sentences guiding the student"
            }

            Do not include markdown, backticks, prose before JSON, or prose after JSON.

            TEACHING GOAL:
            - Build a live classroom whiteboard that supports tutor speech.
            - Prefer clear diagrams, labels, simple animations, and step-by-step reveals.
            - Avoid decorative dashboards or unrelated UI.

            SYNCHRONIZATION RULE:
            - The visualization and walkthrough must describe the same teaching moment.
            - If something moves or updates, the walkthrough must reference that exact behavior.

            REACT LIVE COMPATIBILITY RULES (STRICT):
            1. Write a single self-contained React functional component.
            2. Use function components only.
            3. Do not use imports or exports.
            4. Assume React is globally available.
            5. Use hooks as React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback.
            6. Component name must be LessonVisualization.
            7. End code with: render(<LessonVisualization />);
            8. Do not use external libraries, npm packages, dependencies, routing, contexts, or multiple files.
            9. Code must run immediately in React Live.

            JSX SAFETY RULES:
            - Use className, never class.
            - Return exactly one root JSX element.
            - No top-level fragments.
            - Output valid JavaScript JSX (not TypeScript).
            - No type annotations, interfaces, enums, or generics.
            - No markdown or fenced blocks.

            VARIABLE SAFETY RULES:
            - Every JSX-referenced variable must be defined inside the component.
            - Arrays/objects used in .map() must be declared before use.
            - Event handlers must reference defined functions or inline callbacks.

            STATE AND RENDER SAFETY:
            - Avoid infinite rerender loops.
            - Avoid useEffect dependency loops that continuously set state.
            - Prefer requestAnimationFrame + useRef for animation loops.

            CANVAS RULES (for motion/graph/physics):
            - Use one canvas.
            - Access with: const canvasRef = React.useRef(null).
            - Guard access with: const canvas = canvasRef.current; if (!canvas) return;
            - Use HTML5 Canvas 2D API.
            - Animate using requestAnimationFrame.
            - Scale drawing for devicePixelRatio.

            WHITEBOARD SIMPLICITY:
            - Prefer simple shapes, arrows, labels, highlighted steps, progressive reveals.
            - Avoid complex panels.

            TEACHING INTERACTION:
            - Prefer Next Step buttons, sliders, clickable labels, or animated demonstrations.
            - Interactivity must help concept exploration during tutor explanation.

            STYLING:
            - Tailwind CSS is available.
            - Prefer simple flex/grid/spacing utilities.

            COMPILATION REQUIREMENT:
            - Generated code must compile without syntax errors in React Live.
            - Common mistakes to avoid: class instead of className, undefined variables, missing closing tags, missing render(<LessonVisualization />).
            """;

            String safeInteractivityDescription = interactivityDescription == null ? "" : interactivityDescription.trim();

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText(
                    "Create an interactive React educational visualization for: " + prompt +
                    (safeInteractivityDescription.isBlank()
                        ? ""
                        : "\n\nInteractivity requirements from tutor:\n" + safeInteractivityDescription)
                ))
                .build();

        ConverseRequest request = ConverseRequest.builder()
            .modelId(NOVA_PREMIER_MODEL_ID)
                .system(SystemContentBlock.builder().text(systemInstruction).build())
                .messages(message)
                .build();

        try {
            ConverseResponse response = bedrockClient.converse(request);
            String raw = response.output().message().content().get(0).text().trim();

            ParsedCanvasResponse parsed = parseCanvasResponse(raw, prompt);
            String code = parsed.code();
            String walkthrough = parsed.walkthrough();

            return Map.of("code", code, "walkthrough", walkthrough);
        } catch (Exception e) {
            throw new NeuronFlowException("Failed to generate UI code with Nova Premier: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ParsedCanvasResponse parseCanvasResponse(String raw, String prompt) {
        String codeCandidate = raw == null ? "" : raw;
        String walkthrough = "An interactive visualization about " + prompt + " is now on your whiteboard. Explore the controls to learn more.";

        String jsonCandidate = extractJsonObject(codeCandidate);
        if (!jsonCandidate.isBlank()) {
            try {
                JsonNode node = objectMapper.readTree(jsonCandidate);
                String parsedCode = node.path("code").asText("").trim();
                String parsedWalkthrough = node.path("walkthrough").asText("").trim();

                if (!parsedCode.isBlank()) {
                    codeCandidate = parsedCode;
                }
                if (!parsedWalkthrough.isBlank()) {
                    walkthrough = parsedWalkthrough;
                }
            } catch (Exception ignored) {
            }
        }

        if (codeCandidate.contains("===WALKTHROUGH===")) {
            String[] parts = codeCandidate.split("===WALKTHROUGH===", 2);
            codeCandidate = parts[0].trim();
            if (parts.length > 1 && !parts[1].isBlank()) {
                walkthrough = parts[1].trim();
            }
        } else {
            Matcher walkthroughHeaderMatcher = WALKTHROUGH_HEADER_PATTERN.matcher(codeCandidate);
            if (walkthroughHeaderMatcher.find()) {
                int splitIndex = walkthroughHeaderMatcher.start();
                String possibleWalkthrough = codeCandidate.substring(walkthroughHeaderMatcher.end()).trim();
                codeCandidate = codeCandidate.substring(0, splitIndex).trim();
                if (!possibleWalkthrough.isBlank()) {
                    walkthrough = possibleWalkthrough;
                }
            }
        }

        Matcher fencedMatcher = FENCED_CODE_BLOCK_PATTERN.matcher(codeCandidate);
        if (fencedMatcher.find()) {
            codeCandidate = fencedMatcher.group(1);
        }

        if (codeCandidate.contains("Now, executing corrected code:")) {
            codeCandidate = codeCandidate.substring(codeCandidate.indexOf("Now, executing corrected code:") + "Now, executing corrected code:".length()).trim();
        }

        codeCandidate = codeCandidate
                .replaceAll("^```[a-zA-Z]*\\n", "")
                .replaceAll("\\n```$", "")
                .replaceAll("[“”]", "\"")
                .replaceAll("[‘’]", "'")
                .replaceAll("[–—]", "-")
                .trim();

        Matcher componentStartMatcher = COMPONENT_START_PATTERN.matcher(codeCandidate);
        if (componentStartMatcher.find() && componentStartMatcher.start() > 0) {
            codeCandidate = codeCandidate.substring(componentStartMatcher.start()).trim();
        }

        if (codeCandidate.contains("### Walkthrough")) {
            codeCandidate = codeCandidate.split("(?i)###\\s*walkthrough", 2)[0].trim();
        }

        return new ParsedCanvasResponse(codeCandidate, walkthrough);
    }

    private String extractJsonObject(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        int jsonStart = text.indexOf('{');
        int jsonEnd = text.lastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            return text.substring(jsonStart, jsonEnd + 1).trim();
        }
        return "";
    }

    private record ParsedCanvasResponse(String code, String walkthrough) {
    }
}