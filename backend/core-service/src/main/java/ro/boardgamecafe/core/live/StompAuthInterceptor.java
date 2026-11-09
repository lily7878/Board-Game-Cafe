package ro.boardgamecafe.core.live;

import java.security.Principal;
import org.springframework.core.convert.converter.Converter;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.service.SessionAccessService;

/**
 * Authenticates the STOMP CONNECT frame and authorizes every SUBSCRIBE:
 * - staff: "Authorization: Bearer &lt;JWT&gt;" header; may subscribe to every topic;
 * - participant: "X-Participant-Token" header; may subscribe to /topic/catalog and its own /topic/sessions/{id}.
 * Clients never send messages to the server over WebSocket; changes go through REST.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {
    private final JwtDecoder jwtDecoder;
    private final Converter<Jwt, AbstractAuthenticationToken> staffJwtConverter;
    private final SessionAccessService accessService;

    public StompAuthInterceptor(JwtDecoder jwtDecoder, Converter<Jwt, AbstractAuthenticationToken> staffJwtConverter,
            SessionAccessService accessService) {
        this.jwtDecoder = jwtDecoder;
        this.staffJwtConverter = staffJwtConverter;
        this.accessService = accessService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;
        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT) accessor.setUser(authenticate(accessor));
        else if (command == StompCommand.SUBSCRIBE) authorize(accessor.getUser(), accessor.getDestination());
        else if (command == StompCommand.SEND) throw new MessagingException("Clients cannot send messages.");
        return message;
    }

    private Principal authenticate(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        try {
            if (authorization != null && authorization.startsWith("Bearer ")) {
                AbstractAuthenticationToken staff = staffJwtConverter.convert(jwtDecoder.decode(authorization.substring(7)));
                if (staff == null) throw new MessagingException("Invalid staff token.");
                return staff;
            }
            String participantToken = accessor.getFirstNativeHeader("X-Participant-Token");
            if (participantToken != null) {
                SessionParticipant participant = accessService.authenticate(participantToken);
                return new ParticipantPrincipal(participant.getId(), participant.getSession().getId());
            }
        } catch (MessagingException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new MessagingException("Invalid credentials.");
        }
        throw new MessagingException("Authentication required.");
    }

    private static void authorize(Principal user, String destination) {
        if (user == null || destination == null) throw new MessagingException("Not authenticated.");
        boolean staff = user instanceof JwtAuthenticationToken;
        if (staff && destination.startsWith("/topic/")) return;
        if (LiveEvents.CATALOG_TOPIC.equals(destination)) return;
        if (user instanceof ParticipantPrincipal participant
                && destination.equals(LiveEvents.SESSION_TOPIC_PREFIX + participant.sessionId()))
            return;
        throw new MessagingException("Subscription not allowed: " + destination);
    }
}
