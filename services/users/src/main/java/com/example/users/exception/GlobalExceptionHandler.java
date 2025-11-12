package com.example.users.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Object> handleEmailAlreadyExists(
        EmailAlreadyExistsException ex, 
        WebRequest request
    ) {
        String errorMessage = ex.getMessage();

        return new ResponseEntity<>(errorMessage, HttpStatus.CONFLICT);
    }

}