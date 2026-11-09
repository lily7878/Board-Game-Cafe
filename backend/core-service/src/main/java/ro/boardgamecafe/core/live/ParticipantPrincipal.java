package ro.boardgamecafe.core.live;

import java.security.Principal;

/** WebSocket identity of a participant: may only listen to its own session. */
public record ParticipantPrincipal(Long participantId, Long sessionId) implements Principal {
    @Override
    public String getName() {
        return "participant-" + participantId;
    }
}
