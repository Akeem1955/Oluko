package com.cm.neuronflow.internal.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateDTO {
    private String base64Image;
    private Integer weeklyGoalHours;
}
