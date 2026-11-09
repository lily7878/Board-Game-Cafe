package ro.boardgamecafe.core.exception;

import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.OptimisticLockingFailureException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    /** Version conflicts are expected under concurrency; the internal Hibernate message is not exposed. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLock(OptimisticLockingFailureException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "The data was changed by another request. Reload it and try again.");
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleNotFound(EntityNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({ IllegalArgumentException.class, MethodArgumentNotValidException.class })
    public ProblemDetail handleBadRequest(Exception ex) {
        String detail = ex instanceof MethodArgumentNotValidException validation
                ? validation.getBindingResult().getFieldErrors().stream()
                        .map(error -> error.getField() + ": " + error.getDefaultMessage()).findFirst()
                        .orElse("Request validation failed.")
                : ex.getMessage();
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
    public ProblemDetail handleDuplicateKey(org.springframework.dao.DuplicateKeyException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

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
                    && "uq_staff_email_lower".equals(constraintEx.getConstraintName())) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "Email is already in use.");
            }
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && ("uq_succeeded_payment_per_session".equals(constraintEx.getConstraintName())
                    || "payments_idempotency_key_key".equals(constraintEx.getConstraintName()))) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "This bill has already been paid or the payment is being processed.");
            }
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && ("uq_active_request_per_copy".equals(constraintEx.getConstraintName())
                    || "uq_open_session_per_table".equals(constraintEx.getConstraintName()))) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "The copy or table is already allocated.");
            }
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && "game_copies_inventory_code_key".equals(constraintEx.getConstraintName())) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "A game copy with this inventory code already exists.");
            }
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && "uq_menu_category_name_lower".equals(constraintEx.getConstraintName())) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "A menu category with this name already exists.");
            }
            if (cause instanceof ConstraintViolationException constraintEx
                    && "23505".equals(constraintEx.getSQLState())
                    && "cafe_tables_table_number_key".equals(constraintEx.getConstraintName())) {

                return ProblemDetail.forStatusAndDetail(
                        HttpStatus.CONFLICT,
                        "A table with this number already exists.");
            }

            cause = cause.getCause();
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A database integrity error occurred.");
    }
}
