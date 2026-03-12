package com.cm.neuronflow.internal.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_learning_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLearningStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users users;

    @Column(name = "current_streak")
    private Integer currentStreak;

    @Column(name = "total_minutes_spent")
    private Integer totalMinutesSpent;

    @Column(name = "lessons_completed")
    private Integer lessonsCompleted;

    @Column(name = "global_rank")
    private Integer globalRank;

    @Column(name = "weekly_goal_hours")
    private Integer weeklyGoalHours;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
}
