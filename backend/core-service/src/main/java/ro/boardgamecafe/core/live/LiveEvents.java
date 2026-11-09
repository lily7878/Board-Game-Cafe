package ro.boardgamecafe.core.live;

import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import ro.boardgamecafe.core.domain.table.TableSession;

/**
 * Entry point used by services to announce a change. The event is only queued here; {@link LiveEventBroadcaster}
 * sends it after the surrounding transaction commits, so clients are never told about a change that rolled back.
 */
@Component
public class LiveEvents {
    public static final String STAFF_TOPIC = "/topic/staff";
    public static final String CATALOG_TOPIC = "/topic/catalog";
    public static final String SESSION_TOPIC_PREFIX = "/topic/sessions/";

    /** An event together with the topics it goes to. */
    public record Outgoing(LiveEvent event, List<String> destinations) {}

    private final ApplicationEventPublisher publisher;

    public LiveEvents(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    /** Goes to staff and to the participants of that session. */
    public void session(String type, TableSession session, Long entityId, Object status) {
        LiveEvent event = new LiveEvent(type, session.getId(), session.getTable().getId(), entityId,
                status == null ? null : status.toString(), Instant.now());
        publisher.publishEvent(new Outgoing(event, List.of(STAFF_TOPIC, SESSION_TOPIC_PREFIX + session.getId())));
    }

    /** Goes to staff only (business day, tables, settings administration). */
    public void staff(String type, Long entityId, Object status) {
        LiveEvent event = new LiveEvent(type, null, null, entityId, status == null ? null : status.toString(),
                Instant.now());
        publisher.publishEvent(new Outgoing(event, List.of(STAFF_TOPIC)));
    }

    /** Goes to everyone connected: menu, game catalog availability or settings visible to participants. */
    public void catalog(String type, Long entityId) {
        LiveEvent event = new LiveEvent(type, null, null, entityId, null, Instant.now());
        publisher.publishEvent(new Outgoing(event, List.of(STAFF_TOPIC, CATALOG_TOPIC)));
    }
}
