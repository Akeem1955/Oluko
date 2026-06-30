package com.cm.neuronflow.config.general;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {

    private final String apiKey;

    public GeminiConfig(@Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
    }

    @Bean
    public Client geminiClient() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return new Client.Builder().build();
        }
        return new Client.Builder().apiKey(apiKey).build();
    }
}
