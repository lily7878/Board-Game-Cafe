package ro.boardgamecafe.core.exception;

/**
 * DuplicateTableNumberException
 */
public class DuplicateTableNumberException extends RuntimeException {
    public DuplicateTableNumberException(Integer tableNumber) {
        super("A table with number " + tableNumber + " already exists.");
    }
}
