package com.cm.neuronflow.internal.exceptions;

public class InvalidUserException extends RuntimeException {
    public InvalidUserException() {
        super("Invalid user credentials or user not found");
    }
}
