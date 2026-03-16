package com.cm.neuronflow.controller;

import com.cm.neuronflow.internal.dto.StudyAnalyticsOverviewDTO;
import com.cm.neuronflow.services.StudyAnalyticsService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class StudyAnalyticsController {

    private final StudyAnalyticsService studyAnalyticsService;

    public StudyAnalyticsController(StudyAnalyticsService studyAnalyticsService) {
        this.studyAnalyticsService = studyAnalyticsService;
    }

    @GetMapping("/overview")
    public StudyAnalyticsOverviewDTO getOverview() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return studyAnalyticsService.getOverviewForUser(userId);
    }
}
