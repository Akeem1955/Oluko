package com.cm.neuronflow.controller;

import com.cm.neuronflow.services.NovaToolService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/internal/tools")
public class InternalToolController {

    private static final Logger log = LoggerFactory.getLogger(InternalToolController.class);

    private final NovaToolService novaToolService;

    // The base URL of your backend (e.g., http://localhost:8080 or https://api.neuronflow.com)
    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    public InternalToolController(NovaToolService novaToolService) {
        this.novaToolService = novaToolService;
    }

    @PostMapping("/generate-image")
    public ResponseEntity<Map<String, String>> generateImage(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");

        // 1. Ask AWS to generate and cache the image
        String imageId = novaToolService.generateAndCacheImage(prompt);

        // 2. Construct the URL that the React frontend will use to load it
        String imageUrl = backendUrl + "/api/v1/media/image/" + imageId;

        return ResponseEntity.ok(Map.of("url", imageUrl));
    }

    @PostMapping("/generate-canvas")
    public ResponseEntity<Map<String, String>> generateCanvasCode(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        String interactivityDescription = request.getOrDefault("interactivityDescription", "");

        // Ask AWS to write the React code + a walkthrough description
        Map<String, String> result = novaToolService.generateCanvasCodeWithDescription(prompt, interactivityDescription);

        String code = result.getOrDefault("code", "");
        String walkthrough = result.getOrDefault("walkthrough", "");

        log.info("Generated canvas payload: codeLength={}, walkthroughLength={}", code.length(), walkthrough.length());
        log.info("Canvas generation prompt: {}", prompt);
        if (!interactivityDescription.isBlank()) {
            log.info("Canvas interactivity description: {}", interactivityDescription);
        }
        log.info("Generated canvas code:\n{}", code);
        log.info("Generated canvas walkthrough:\n{}", walkthrough);

        return ResponseEntity.ok(result);
    }
}