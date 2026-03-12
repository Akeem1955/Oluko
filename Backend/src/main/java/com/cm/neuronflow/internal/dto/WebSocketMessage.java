package com.cm.neuronflow.internal.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage {
    private String type;
    private Map<String, Object> data;
}
