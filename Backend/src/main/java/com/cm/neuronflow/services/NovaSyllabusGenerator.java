package com.cm.neuronflow.services;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.*;

@Service
public class NovaSyllabusGenerator {

    private final BedrockRuntimeClient bedrockClient;
    private static final String NOVA_LITE_MODEL_ID = "us.amazon.nova-lite-v1:0";

    public NovaSyllabusGenerator(BedrockRuntimeClient bedrockClient) {
        this.bedrockClient = bedrockClient;
    }

    @Retry(name = "bedrockApi", fallbackMethod = "fallbackGenerateSyllabus")
    @CircuitBreaker(name = "bedrockApi")
    public String generateSyllabus(String topic, String contextMaterial, String targetLanguage) {

        String prompt = buildPrompt(topic, contextMaterial, targetLanguage);

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText(prompt))
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(NOVA_LITE_MODEL_ID)
                .messages(message)
                .build();

        ConverseResponse response = bedrockClient.converse(request);
        return response.output().message().content().get(0).text();
    }

    // Resilience4j Fallback
    public String fallbackGenerateSyllabus(String topic, String contextMaterial, String targetLanguage, Throwable t) {
        throw new RuntimeException("Amazon Nova API is currently unavailable after retries: " + t.getMessage());
    }

    /**
     * TOPIC mode: Generate comprehensive reference material about a topic
     * so Nova Sonic has ground truth to teach from.
     */
    public String generateTopicContext(String topic, String targetLanguage) {
        String prompt = String.format("""
            You are an expert educator. Generate comprehensive, factual reference material about '%s' in %s.
            
            Cover key concepts, definitions, examples, and important details that a tutor would need
            to teach this topic effectively. Be thorough and accurate.
            Do NOT generate a syllabus or lesson plan - generate the actual teaching content and knowledge.
            """, topic, targetLanguage);

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromText(prompt))
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(NOVA_LITE_MODEL_ID)
                .messages(message)
                .build();

        ConverseResponse response = bedrockClient.converse(request);
        return response.output().message().content().get(0).text();
    }

    /**
     * VIDEO mode: Use Nova Lite's multimodal capabilities to analyze a video
     * and extract all educational content as text.
     */
    public String analyzeVideoContent(byte[] videoBytes, String targetLanguage) {
        VideoSource source = VideoSource.builder()
                .bytes(SdkBytes.fromByteArray(videoBytes))
                .build();

        VideoBlock videoBlock = VideoBlock.builder()
                .source(source)
                .format(VideoFormat.MP4)
                .build();

        String prompt = String.format("""
            Analyze this video thoroughly in %s. Extract all educational content, key concepts,
            facts, explanations, and knowledge presented.
            
            Produce a comprehensive text summary that captures everything a tutor would need
            to teach the material covered in this video. Be detailed and accurate.
            """, targetLanguage);

        Message message = Message.builder()
                .role(ConversationRole.USER)
                .content(ContentBlock.fromVideo(videoBlock), ContentBlock.fromText(prompt))
                .build();

        ConverseRequest request = ConverseRequest.builder()
                .modelId(NOVA_LITE_MODEL_ID)
                .messages(message)
                .build();

        ConverseResponse response = bedrockClient.converse(request);
        return response.output().message().content().get(0).text();
    }

    private String buildPrompt(String topic, String contextMaterial, String targetLanguage) {
        return String.format("""
            You are an expert Instructional Designer. 
            Create a highly structured course syllabus about '%s' in %s.
            
            CONTEXT MATERIAL:
            %s
            
            Based on the context above, generate a JSON array of lessons. 
            Do NOT include markdown formatting or backticks. Return ONLY raw JSON.
            
            Format exactly like this:[
              {
                "title": "Lesson 1: Introduction",
                "objective": "Detailed text that an AI voice tutor will use to teach this lesson..."
              }
            ]
            """, topic != null ? topic : "the provided document", targetLanguage, contextMaterial != null ? contextMaterial : "Use your general knowledge.");
    }
}