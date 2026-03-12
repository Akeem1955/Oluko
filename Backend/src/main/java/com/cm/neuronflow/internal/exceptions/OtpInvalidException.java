package com.cm.neuronflow.internal.exceptions;

public class OtpInvalidException extends RuntimeException {
    public OtpInvalidException() {
        super("Invalid or expired OTP");
    }
}
