package com.cm.neuronflow.internal.events;

import com.cm.neuronflow.internal.domain.Users;
import lombok.Getter;

@Getter
public class SendOtpEvent {
    private final Users user;

    public SendOtpEvent(Users user) {
        this.user = user;
    }
}
