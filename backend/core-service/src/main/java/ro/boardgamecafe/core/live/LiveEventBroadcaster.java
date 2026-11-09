package ro.boardgamecafe.core.live;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Sends queued live events to the STOMP broker, only after a successful commit. */
@Component
public class LiveEventBroadcaster {
    private static final Logger log = LoggerFactory.getLogger(LiveEventBroadcaster.class);
    private final SimpMessagingTemplate messaging;

    public LiveEventBroadcaster(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(LiveEvents.Outgoing outgoing) {
        for (String destination : outgoing.destinations()) {
            try {
                messaging.convertAndSend(destination, outgoing.event());
            } catch (RuntimeException ex) {
                // A lost notification is acceptable: clients refetch through REST after reconnecting.
                log.warn("Could not broadcast {} to {}: {}", outgoing.event().type(), destination, ex.getMessage());
            }
        }
    }
}
