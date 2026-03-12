package com.cm.neuronflow.controller;


import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.repository.LessonRepository;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/livekit")
public class LiveKitController {

    private final LessonRepository lessonRepository;

    // You will get these from your free LiveKit Cloud account
    @Value("${livekit.api.key}")
    private String livekitApiKey;

    @Value("${livekit.api.secret}")
    private String livekitApiSecret;

    @Value("${livekit.url}")
    private String livekitUrl;

    public LiveKitController(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    @GetMapping("/token")
    public ResponseEntity<Map<String, String>> generateToken(@RequestParam UUID lessonId) {
        // 1. Get the current logged-in user
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Fetch the lesson to ensure it exists
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NeuronFlowException("Lesson not found", HttpStatus.NOT_FOUND));

        // The room name will be the Lesson ID so the Python agent knows exactly which room to join
        String roomName = lesson.getId().toString();

        // We use the user's email as their unique participant identity
        String participantIdentity = userEmail;

        try {
            // 3. Generate the Secure LiveKit Access Token
            AccessToken token = new AccessToken(livekitApiKey, livekitApiSecret);

            // Grant permission to join this specific room and publish/subscribe to audio/data
            token.setName(participantIdentity);
            token.setIdentity(participantIdentity);
            token.addGrants(new RoomJoin(true), new RoomName(roomName));

            // Generate the JWT string
            String jwtToken = token.toJwt();

            // 4. Send it to the frontend!
            return ResponseEntity.ok(Map.of(
                    "token", jwtToken,
                    "roomName", roomName,
                    "livekitUrl", livekitUrl
            ));

        } catch (Exception e) {
            throw new NeuronFlowException("Failed to generate LiveKit token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}