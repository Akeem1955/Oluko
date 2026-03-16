package com.cm.neuronflow.internal.repository;

import com.cm.neuronflow.internal.domain.LessonResumeState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonResumeStateRepository extends JpaRepository<LessonResumeState, UUID> {
    Optional<LessonResumeState> findByLessonId(UUID lessonId);
}
