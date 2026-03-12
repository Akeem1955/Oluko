package com.cm.neuronflow.internal.repository;




import com.cm.neuronflow.internal.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Course> findTop5ByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserId(String userId);
}
