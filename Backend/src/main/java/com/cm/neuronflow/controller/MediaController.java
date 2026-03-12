// FILE: .\src\main\java\com\cm\neuronflow\controller\MediaController.java
package com.cm.neuronflow.controller;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final RedisTemplate<String, Object> redisTemplate;

    public MediaController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/image/{uuid}")
    public ResponseEntity<byte[]> getImage(@PathVariable String uuid) {
        String redisKey = "whiteboard_image:" + uuid;

        // 1. Fetch the Base64 string from Redis
        String base64Image = (String) redisTemplate.opsForValue().get(redisKey);

        // 2. If it expired (past 2 hours) or doesn't exist, return 404
        if (base64Image == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        try {
            // 3. Decode the Base64 string back into raw image bytes
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            // 4. Set headers so the browser natively renders it as <img src="...">
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl("public, max-age=7200"); // 2 hours browser cache

            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}