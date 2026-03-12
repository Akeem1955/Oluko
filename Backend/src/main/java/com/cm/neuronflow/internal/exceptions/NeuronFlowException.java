package com.cm.neuronflow.internal.exceptions;



import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NeuronFlowException extends RuntimeException {
    private final HttpStatus status;

    public NeuronFlowException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
