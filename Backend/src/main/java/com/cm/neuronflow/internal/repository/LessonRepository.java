package com.cm.neuronflow.internal.repository;



import com.cm.neuronflow.internal.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {
}
