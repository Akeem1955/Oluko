package com.cm.neuronflow.internal.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAnalyticsItemDTO {
    private String id;
    private String type;
    private String lessonTitle;
    private Integer masteryScore;
    private Integer clarityScore;
    private Integer retentionScore;
    private Integer quizAccuracy;
    private String strengths;
    private String weakAreas;
    private String recommendation;
    private LocalDateTime createdAt;
}
