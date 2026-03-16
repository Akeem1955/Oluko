package com.cm.neuronflow.internal.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lesson_resume_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResumeState {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false, unique = true)
    private Lesson lesson;

    @Column(name = "completion_percent", nullable = false)
    private Integer completionPercent;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted;

    @Column(name = "resume_summary", columnDefinition = "TEXT")
    private String resumeSummary;

    @Column(name = "last_transcript", columnDefinition = "TEXT")
    private String lastTranscript;

    @Column(name = "last_shutdown_reason")
    private String lastShutdownReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
