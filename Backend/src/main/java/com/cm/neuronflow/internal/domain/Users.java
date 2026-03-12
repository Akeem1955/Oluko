package com.cm.neuronflow.internal.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "available_token")
    private Integer availableToken;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "users", cascade = CascadeType.ALL)
    private UserLearningStats stats;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (availableToken == null) {
            availableToken = 0;
        }
    }
}
