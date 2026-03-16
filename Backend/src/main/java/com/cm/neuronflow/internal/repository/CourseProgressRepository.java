package com.cm.neuronflow.internal.repository;

import com.cm.neuronflow.internal.domain.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, UUID> {
    Optional<CourseProgress> findByUserIdAndCourseId(String userId, UUID courseId);
}
