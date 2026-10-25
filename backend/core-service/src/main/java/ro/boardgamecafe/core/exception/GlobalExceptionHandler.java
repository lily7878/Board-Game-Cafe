package ro.boardgamecafe.core.exception;

import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;

@RestControllerAdvice 
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateTableNumberException.class)
    public ProblemDetail handleDuplicateTableNumber(DuplicateTableNumberException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex) {

        Throwable cause = ex;

        while (cause != null) {
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && "cafe_tables_table_number_key".equals(constraintEx.getConstraintName())) {

                return ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT,
                    "A table with this number already exists."
                );
            }

            cause = cause.getCause();
        }

        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "A database integrity error occurred."
        );
    }
}
