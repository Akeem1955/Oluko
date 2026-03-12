package com.cm.neuronflow.internal.domain;


import com.cm.neuronflow.internal.domain.enums.CourseStatus;
import com.cm.neuronflow.internal.domain.enums.LearningMode;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @Column(nullable = false)
    private String userId; // Linked to your JWT Auth

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LearningMode learningMode;

    @Column(nullable = false)
    private String targetLanguage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status;

    @JsonIgnore
    @Column(columnDefinition = "TEXT")
    private String sourceMaterial; // The extracted text from Tika or Video transcript

    @JsonIgnore
    @Column(columnDefinition = "TEXT")
    private String errorMessage; // Stores meaningful error if status == FAILED

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Lesson> lessons = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}