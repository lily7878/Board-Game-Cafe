package ro.boardgamecafe.core.exception;

public class GameRequestConflictException extends RuntimeException {
    public GameRequestConflictException(String message) { super(message); }
}
