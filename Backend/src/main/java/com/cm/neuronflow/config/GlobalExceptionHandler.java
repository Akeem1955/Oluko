package com.cm.neuronflow.config;

import com.cm.neuronflow.internal.dto.ErrorResponse;
import com.cm.neuronflow.internal.exceptions.ClassLimitExceededException;
import com.cm.neuronflow.internal.exceptions.InvalidUserException;
import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import com.cm.neuronflow.internal.exceptions.OtpInvalidException;
import com.cm.neuronflow.internal.exceptions.UserAlreadyExistsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;

/**
 * Global exception handler for the NeuronFlow API.
 * Maps specific exceptions to appropriate HTTP status codes.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle ClassLimitExceededException - user has reached maximum class limit.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(ClassLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleClassLimitExceeded(
            ClassLimitExceededException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Class limit exceeded. Maximum 3 active classes allowed.",
                request.getDescription(false)
        );
    }

    /**
     * Handle IllegalStateException - generic business rule violations.
     * This includes "User already has an active session" errors.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                request.getDescription(false)
        );
    }

    /**
     * Handle ArrayIndexOutOfBoundsException - invalid unit index.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(ArrayIndexOutOfBoundsException.class)
    public ResponseEntity<ErrorResponse> handleArrayIndexOutOfBounds(
            ArrayIndexOutOfBoundsException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid unit index specified.",
                request.getDescription(false)
        );
    }

    /**
     * Handle IndexOutOfBoundsException - invalid index access.
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(IndexOutOfBoundsException.class)
    public ResponseEntity<ErrorResponse> handleIndexOutOfBounds(
            IndexOutOfBoundsException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid index specified.",
                request.getDescription(false)
        );
    }

    /**
     * Handle IllegalArgumentException - validation errors (e.g., invalid YouTube URL, video too short).
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request.getDescription(false)
        );
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(
            UserAlreadyExistsException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                request.getDescription(false)
        );
    }

    @ExceptionHandler(InvalidUserException.class)
    public ResponseEntity<ErrorResponse> handleInvalidUser(
            InvalidUserException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password",
                request.getDescription(false)
        );
    }

    @ExceptionHandler(OtpInvalidException.class)
    public ResponseEntity<ErrorResponse> handleOtpInvalid(
            OtpInvalidException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid or expired OTP",
                request.getDescription(false)
        );
    }

    /**
     * Handle MaxUploadSizeExceededException - file upload exceeds limit.
     * Returns 413 Payload Too Large.
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex, WebRequest request) {
        return buildErrorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "File size exceeds the allowed limit.",
                request.getDescription(false)
        );
    }

    @ExceptionHandler(NeuronFlowException.class)
    public ResponseEntity<ErrorResponse> handleNeuronFlowException(
            NeuronFlowException ex, WebRequest request) {
        return buildErrorResponse(
                ex.getStatus(),
                ex.getMessage(),
                request.getDescription(false)
        );
    }

    /**
     * Catch-all handler for all other exceptions.
     * Returns 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
        log.error("Unhandled exception occurred: ", ex);
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.",
                request.getDescription(false)
        );
    }

    /**
     * Build a standardized error response.
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status, String message, String path) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now().toString())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path.replace("uri=", ""))
                .build();
        return new ResponseEntity<>(errorResponse, status);
    }
}

