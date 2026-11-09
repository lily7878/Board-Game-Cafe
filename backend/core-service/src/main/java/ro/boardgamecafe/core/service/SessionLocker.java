package ro.boardgamecafe.core.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.domain.table.TableSession;

/**
 * Takes the row lock on a session (SELECT ... FOR UPDATE) and reloads its current state.
 *
 * Flows that authenticate a participant have usually loaded the session already. A plain locking query
 * would then meet a newer version committed by the request we waited for (for example a payment that
 * closed the session) and fail with a version conflict. Refreshing under the lock instead gives the
 * waiting request the committed state, so it can answer with a clear business error or replay a result.
 */
@Component
public class SessionLocker {
    private final EntityManager entityManager;

    public SessionLocker(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public TableSession lock(Long sessionId) {
        TableSession session = entityManager.find(TableSession.class, sessionId);
        if (session == null) throw new EntityNotFoundException("Session not found with id: " + sessionId);
        entityManager.refresh(session, LockModeType.PESSIMISTIC_WRITE);
        return session;
    }
}
