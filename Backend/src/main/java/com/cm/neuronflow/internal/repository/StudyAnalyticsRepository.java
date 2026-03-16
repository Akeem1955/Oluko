package com.cm.neuronflow.internal.repository;

import com.cm.neuronflow.internal.domain.StudyAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyAnalyticsRepository extends JpaRepository<StudyAnalytics, UUID> {
    List<StudyAnalytics> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
}
