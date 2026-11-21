package ro.boardgamecafe.core.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** 429 with a Retry-After header (seconds), so the UI can tell the user when to try again. */
public class TooManyRequestsException extends ResponseStatusException {
    private final long retryAfterSeconds;

    public TooManyRequestsException(String reason, long retryAfterSeconds) {
        super(HttpStatus.TOO_MANY_REQUESTS, reason);
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    @Override
    public HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSeconds));
        return headers;
    }
}
