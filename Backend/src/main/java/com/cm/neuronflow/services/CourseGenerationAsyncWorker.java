// FILE: .\src\main\java\com\cm\neuronflow\services\CourseGenerationAsyncWorker.java
package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.domain.Course;
import com.cm.neuronflow.internal.domain.Lesson;
import com.cm.neuronflow.internal.domain.enums.CourseStatus;
import com.cm.neuronflow.internal.domain.enums.LearningMode;
import com.cm.neuronflow.internal.repository.CourseRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class CourseGenerationAsyncWorker {

    private final CourseRepository courseRepository;
    private final DocumentExtractionService extractionService;
    private final GeminiSyllabusGenerator geminiSyllabusGenerator;
    private final ObjectMapper objectMapper;

    public CourseGenerationAsyncWorker(CourseRepository courseRepository,
                                       DocumentExtractionService extractionService,
                                       GeminiSyllabusGenerator geminiSyllabusGenerator,
                                       ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.extractionService = extractionService;
        this.geminiSyllabusGenerator = geminiSyllabusGenerator;
        this.objectMapper = objectMapper;
    }

    @Async
    @Transactional
    public void processCourseGeneration(UUID courseId, byte[] fileBytes, String topic) {
        log.info("Starting async course generation for Course ID: {}", courseId);
        Course course = courseRepository.findById(courseId).orElseThrow();

        try {
            course.setStatus(CourseStatus.GENERATING);
            courseRepository.save(course);

            String contextMaterial = "";

            // 1. Digestion Phase
            if (course.getTitle() != null && course.getTitle().startsWith("TEACHER_CLASS::")) {
                String titleString = course.getTitle();
                String extractedTitle = "Teacher Class";
                String query = titleString.substring("TEACHER_CLASS::".length());
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("title=")) {
                        try {
                            extractedTitle = java.net.URLDecoder.decode(param.substring(6), java.nio.charset.StandardCharsets.UTF_8.name());
                        } catch (Exception e) {
                            extractedTitle = param.substring(6);
                        }
                    }
                }
                topic = extractedTitle;
                if (fileBytes != null && fileBytes.length > 0) {
                    contextMaterial = extractionService.extractTextFromBytes(fileBytes);
                } else {
                    contextMaterial = geminiSyllabusGenerator.generateTopicContext(extractedTitle, course.getTargetLanguage());
                }
            } else if (course.getTitle() != null && course.getTitle().startsWith("YOUTUBE_CLASS::")) {
                String titleString = course.getTitle();
                String extractedTopic = "YouTube Video Course";
                String query = titleString.substring("YOUTUBE_CLASS::".length());
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("topic=")) {
                        try {
                            extractedTopic = java.net.URLDecoder.decode(param.substring(6), java.nio.charset.StandardCharsets.UTF_8.name());
                        } catch (Exception e) {
                            extractedTopic = param.substring(6);
                        }
                    }
                }
                contextMaterial = geminiSyllabusGenerator.generateTopicContext(extractedTopic, course.getTargetLanguage());
                topic = extractedTopic;
            } else if (course.getLearningMode() == LearningMode.DOCUMENT && fileBytes != null) {
                contextMaterial = extractionService.extractTextFromBytes(fileBytes);
            } else if (course.getLearningMode() == LearningMode.VIDEO && fileBytes != null) {
                contextMaterial = geminiSyllabusGenerator.analyzeVideoContent(fileBytes, course.getTargetLanguage());
            } else if (course.getLearningMode() == LearningMode.TOPIC) {
                contextMaterial = geminiSyllabusGenerator.generateTopicContext(topic, course.getTargetLanguage());
            }

            // Save the grounded context for Sonic to reference later
            course.setSourceMaterial(contextMaterial);

            // 2. Syllabus Generation (Gemini 3.5 Flash)
            log.info("Calling Gemini 3.5 Flash for syllabus generation. Topic: {}", topic);
            String jsonSyllabus = geminiSyllabusGenerator.generateSyllabus(topic, contextMaterial, course.getTargetLanguage());

            // Clean markdown blocks if Nova accidentally includes them
            if (jsonSyllabus.startsWith("```json")) {
                jsonSyllabus = jsonSyllabus.replace("```json", "").replace("```", "").trim();
            } else if (jsonSyllabus.startsWith("```")) {
                jsonSyllabus = jsonSyllabus.replace("```", "").trim();
            }

            // 3. Parse and Save Lessons
            List<Map<String, String>> parsedLessons = objectMapper.readValue(jsonSyllabus, new TypeReference<>() {});

            int order = 1;
            for (Map<String, String> lessonMap : parsedLessons) {
                Lesson lesson = Lesson.builder()
                        .course(course)
                        .orderIndex(order++)
                        .title(lessonMap.get("title"))
                        .objective(lessonMap.get("objective"))
                        .build();
                course.getLessons().add(lesson);
            }

            // 4. Mark Ready!
            course.setStatus(CourseStatus.READY);
            courseRepository.save(course);
            log.info("Course generation completed successfully for Course ID: {}", courseId);

        } catch (Exception e) {
            log.error("Course generation failed for Course ID: {}. Reason: {}", courseId, e.getMessage(), e);
            course.setStatus(CourseStatus.FAILED);
            course.setErrorMessage(e.getMessage());
            courseRepository.save(course);
        }
    }
}