package com.cm.neuronflow.internal.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonSessionTranscriptRequest {
    private String transcript;
    private Boolean endedByAgent;
    private String shutdownReason;
}
