package com.cm.neuronflow.internal.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAnalyticsOverviewDTO {
    private int totalSessions;
    private int quizSessions;
    private int lessonSessions;
    private int avgMasteryScore;
    private int avgQuizAccuracy;
    private List<StudyAnalyticsItemDTO> recentSessions;
}
