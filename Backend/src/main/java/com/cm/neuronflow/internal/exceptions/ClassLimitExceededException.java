package com.cm.neuronflow.internal.exceptions;

public class ClassLimitExceededException extends RuntimeException {
    public ClassLimitExceededException(String message) {
        super(message);
    }
}
