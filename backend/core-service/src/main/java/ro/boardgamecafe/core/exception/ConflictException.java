package ro.boardgamecafe.core.exception;

/** A request that is valid but conflicts with the current state (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
