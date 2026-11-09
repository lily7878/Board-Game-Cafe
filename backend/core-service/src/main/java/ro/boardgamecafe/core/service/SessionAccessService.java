package ro.boardgamecafe.core.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.time.Instant;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.table.dto.JoinTableSessionRequest;
import ro.boardgamecafe.core.api.table.dto.JoinTableSessionResponse;
import ro.boardgamecafe.core.api.table.dto.OpenTableSessionResponse;
import ro.boardgamecafe.core.api.table.dto.SessionParticipantResponse;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.GameRequestConflictException;
import ro.boardgamecafe.core.repository.CafeTableRepository;
import ro.boardgamecafe.core.repository.SessionParticipantRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;
import ro.boardgamecafe.core.domain.staff.StaffUser;

@Service
public class SessionAccessService {
    private final SecureRandom random = new SecureRandom();
    private final BCryptPasswordEncoder pinEncoder = new BCryptPasswordEncoder();
    private final CafeTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final StaffUserRepository staffRepository;
    private final SessionCredentialsCipher credentialsCipher;
    private final BusinessDayService businessDayService;
    private final CafeSettingsService settingsService;

    public SessionAccessService(CafeTableRepository tableRepository, TableSessionRepository sessionRepository,
            SessionParticipantRepository participantRepository, StaffUserRepository staffRepository,
            SessionCredentialsCipher credentialsCipher, BusinessDayService businessDayService,
            CafeSettingsService settingsService) {
        this.tableRepository = tableRepository;
        this.sessionRepository = sessionRepository;
        this.participantRepository = participantRepository;
        this.staffRepository = staffRepository;
        this.credentialsCipher = credentialsCipher;
        this.businessDayService = businessDayService;
        this.settingsService = settingsService;
    }

    @Transactional
    public OpenTableSessionResponse open(Long tableId, String staffEmail) {
        CafeTable table = tableRepository.findByIdForUpdate(tableId)
                .orElseThrow(() -> new EntityNotFoundException("Table not found with id: " + tableId));
        if (!table.getActive() || sessionRepository.existsByTableIdAndStatusNot(tableId, SessionStatus.CLOSED))
            throw new GameRequestConflictException("Table is inactive or already has an open session.");
        BusinessDay day = businessDayService.lockOpenDay();
        BigDecimal feeSnapshot = settingsService.current().getAccessFeePrice();
        String joinToken = newToken();
        String pin = "%06d".formatted(random.nextInt(1_000_000));
        StaffUser openedBy = staffRepository.findByEmailIgnoreCase(staffEmail)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
        TableSession session = sessionRepository.save(new TableSession(table, openedBy, day, feeSnapshot,
                digest(joinToken), pinEncoder.encode(pin), credentialsCipher.encrypt(joinToken),
                credentialsCipher.encrypt(pin)));
        return response(session, joinToken, pin);
    }

    private static OpenTableSessionResponse response(TableSession session, String joinToken, String pin) {
        return new OpenTableSessionResponse(session.getId(), session.getTable().getId(), joinToken, pin,
                session.getStartedAt(), session.getBusinessDay().getId(), session.getAccessFeeUnitPrice());
    }

    @Transactional(readOnly = true)
    public OpenTableSessionResponse preview(Long tableId) {
        TableSession session = sessionRepository.findByTableIdAndStatusNot(tableId, SessionStatus.CLOSED)
                .orElseThrow(() -> new EntityNotFoundException("Open session not found for table: " + tableId));
        if (session.getStatus() != SessionStatus.ACTIVE)
            throw new GameRequestConflictException("Session access is hidden during checkout.");
        return response(session, credentialsCipher.decrypt(session.getJoinTokenEncrypted()),
                credentialsCipher.decrypt(session.getPinEncrypted()));
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public JoinTableSessionResponse join(JoinTableSessionRequest request) {
        TableSession session = sessionRepository.findByJoinTokenDigestForUpdate(digest(request.joinToken()))
                .orElseThrow(() -> unauthorized());
        if (session.getStatus() != SessionStatus.ACTIVE) throw unauthorized();
        Instant now = Instant.now();
        if (session.joinLocked(now))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many PIN attempts. Try again later.");
        if (!pinEncoder.matches(request.pin(), session.getPinHash())) {
            session.recordFailedJoin(now);
            throw unauthorized();
        }
        session.clearJoinFailures();
        String accessToken = newToken();
        SessionParticipant participant = participantRepository.save(
                new SessionParticipant(session, request.displayName(), digest(accessToken)));
        return new JoinTableSessionResponse(session.getId(), participant.getId(), participant.getDisplayName(), accessToken);
    }

    @Transactional(readOnly = true)
    public SessionParticipant authenticate(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) throw unauthorized();
        SessionParticipant participant = participantRepository.findByAccessTokenHash(digest(accessToken))
                .orElseThrow(() -> unauthorized());
        if (!participant.isActive() || participant.getSession().getStatus() == SessionStatus.CLOSED) throw unauthorized();
        return participant;
    }

    /**
     * Identifies the token owner without checking that the session is still open. Used only to replay
     * the stored result of an idempotent payment after the session was closed by that payment.
     */
    @Transactional(readOnly = true)
    public SessionParticipant identify(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) throw unauthorized();
        return participantRepository.findByAccessTokenHash(digest(accessToken)).orElseThrow(() -> unauthorized());
    }

    @Transactional(readOnly = true)
    public SessionParticipantResponse current(String accessToken) {
        SessionParticipant participant = authenticate(accessToken);
        return new SessionParticipantResponse(participant.getSession().getId(), participant.getId(),
                participant.getDisplayName(), participant.getJoinedAt());
    }

    @Transactional
    public void leave(String accessToken) { authenticate(accessToken).leave(); }

    private String newToken() {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session credentials.");
    }
}
