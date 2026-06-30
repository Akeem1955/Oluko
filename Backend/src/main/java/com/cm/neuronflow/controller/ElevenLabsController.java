package com.cm.neuronflow.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/elevenlabs")
public class ElevenLabsController {

    @Value("${elevenlabs.api.key:}")
    private String elevenlabsApiKey;

    @PostMapping("/clone-voice")
    public ResponseEntity<Map<String, String>> cloneVoice(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file
    ) {
        if (elevenlabsApiKey == null || elevenlabsApiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "ElevenLabs API Key is not configured on the server."));
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("xi-api-key", elevenlabsApiKey);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("name", name);

            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("files", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            RestTemplate restTemplate = new RestTemplate();
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.elevenlabs.io/v1/voices/add",
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String voiceId = (String) response.getBody().get("voice_id");
                return ResponseEntity.ok(Map.of("voiceId", voiceId));
            } else {
                return ResponseEntity.status(response.getStatusCode())
                        .body(Map.of("error", "Failed to clone voice via ElevenLabs."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error calling ElevenLabs: " + e.getMessage()));
        }
    }
}
