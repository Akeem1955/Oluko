package com.cm.neuronflow.internal.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private String email;
    private String fullName;
    private String profilePicture;
    private Integer availableToken;
    private LocalDateTime createdAt;
    private UserLearningStatsDTO stats;
}
