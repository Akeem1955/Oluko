package com.cm.neuronflow.internal.domain;

import com.cm.neuronflow.internal.domain.enums.AnalyticsType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "study_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "analytics_type", nullable = false)
    private AnalyticsType analyticsType;

    @Column(name = "mastery_score", nullable = false)
    private Integer masteryScore;

    @Column(name = "clarity_score", nullable = false)
    private Integer clarityScore;

    @Column(name = "retention_score", nullable = false)
    private Integer retentionScore;

    @Column(name = "quiz_accuracy")
    private Integer quizAccuracy;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weak_areas", columnDefinition = "TEXT")
    private String weakAreas;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "transcript_excerpt", columnDefinition = "TEXT")
    private String transcriptExcerpt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
