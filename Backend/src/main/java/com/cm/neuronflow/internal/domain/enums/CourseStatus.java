package com.cm.neuronflow.internal.domain.enums;


public enum CourseStatus {
    PENDING,      // Uploaded, waiting for background worker
    GENERATING,   // Nova 2 Lite is currently digesting and structuring
    READY,        // Complete and ready for Sonic WebSocket
    FAILED        // Resilience4j fallback triggered (e.g., Bedrock timeout)
}