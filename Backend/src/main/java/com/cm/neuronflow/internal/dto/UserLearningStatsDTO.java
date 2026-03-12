package com.cm.neuronflow.internal.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLearningStatsDTO {
    private Integer currentStreak;
    private Integer totalMinutesSpent;
    private Integer lessonsCompleted;
    private Integer globalRank;
    private Integer weeklyGoalHours;
    private LocalDateTime lastActiveAt;
}
