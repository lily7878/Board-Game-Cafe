package ro.boardgamecafe.core.service;

import java.util.List;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.game.dto.GameRequestResponse;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.game.GameCopy;
import ro.boardgamecafe.core.domain.game.GameRequest;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.GameRequestConflictException;
import ro.boardgamecafe.core.repository.GameCopyRepository;
import ro.boardgamecafe.core.repository.GameRepository;
import ro.boardgamecafe.core.repository.GameRequestRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;
import ro.boardgamecafe.core.domain.staff.StaffUser;

@Service
@Transactional(readOnly = true)
public class GameRequestService {
    private final GameRequestRepository requestRepository;
    private final GameRepository gameRepository;
    private final GameCopyRepository copyRepository;
    private final TableSessionRepository sessionRepository;
    private final SessionAccessService accessService;
    private final StaffUserRepository staffRepository;
    private final CafeSettingsService settingsService;
    private final SessionLocker sessionLocker;

    public GameRequestService(GameRequestRepository requestRepository, GameRepository gameRepository,
            GameCopyRepository copyRepository, TableSessionRepository sessionRepository,
            SessionAccessService accessService, StaffUserRepository staffRepository,
            CafeSettingsService settingsService, SessionLocker sessionLocker) {
        this.sessionLocker = sessionLocker;
        this.requestRepository = requestRepository;
        this.gameRepository = gameRepository;
        this.copyRepository = copyRepository;
        this.sessionRepository = sessionRepository;
        this.accessService = accessService;
        this.staffRepository = staffRepository;
        this.settingsService = settingsService;
    }

    @Transactional
    public GameRequestResponse request(String accessToken, Long gameId) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        TableSession session = lockSession(participant.getSession().getId());
        if (session.getStatus() != SessionStatus.ACTIVE)
            throw new GameRequestConflictException("New game requests require an active session.");
        Game game = gameRepository.findByIdAndActiveTrue(gameId)
                .orElseThrow(() -> new EntityNotFoundException("Active game not found with id: " + gameId));
        return response(requestRepository.save(new GameRequest(participant, game)));
    }

    @Transactional
    public GameRequestResponse reserve(Long id, String staffEmail) {
        GameRequest request = lockRequest(id);
        if (request.getStatus() != GameRequestStatus.REQUESTED)
            throw new GameRequestConflictException("Only requested games can be reserved.");
        if (request.getSession().getStatus() == SessionStatus.CLOSED)
            throw new GameRequestConflictException("The session is closed.");
        GameCopy copy = copyRepository.findReservableCopy(request.getGame().getId())
                .orElseThrow(() -> new GameRequestConflictException("No usable copy is available."));
        request.reserve(copy);
        request.recordProcessor(staff(staffEmail));
        requestRepository.flush();
        return response(request);
    }

    @Transactional
    public GameRequestResponse deliver(Long id, String staffEmail) {
        GameRequest request = lockRequest(id);
        TableSession session = lockSession(request.getSession().getId());
        if (request.getStatus() != GameRequestStatus.RESERVED)
            throw new GameRequestConflictException("Only reserved games can be delivered.");
        if (session.getStatus() == SessionStatus.CLOSED)
            throw new GameRequestConflictException("The session is closed.");
        if (requestRepository.countBySessionIdAndStatus(session.getId(), GameRequestStatus.DELIVERED)
                >= settingsService.current().getMaxDeliveredGamesPerTable())
            throw new GameRequestConflictException("The session has reached its delivered game limit.");
        GameCopy copy = copyRepository.findByIdForUpdate(request.getGameCopy().getId())
                .orElseThrow(() -> new EntityNotFoundException("Reserved game copy not found."));
        if (copy.getConditionStatus() != CopyCondition.USABLE)
            throw new GameRequestConflictException("The reserved copy is no longer usable.");
        request.deliver();
        request.recordProcessor(staff(staffEmail));
        return response(request);
    }

    @Transactional
    public GameRequestResponse returnCopy(Long id, CopyCondition condition, String staffEmail) {
        GameRequest request = lockRequest(id);
        if (request.getStatus() != GameRequestStatus.DELIVERED)
            throw new GameRequestConflictException("Only delivered games can be returned.");
        GameCopy copy = copyRepository.findByIdForUpdate(request.getGameCopy().getId())
                .orElseThrow(() -> new EntityNotFoundException("Delivered game copy not found."));
        copy.changeConditionStatus(condition);
        request.returnCopy();
        request.recordProcessor(staff(staffEmail));
        return response(request);
    }

    @Transactional
    public GameRequestResponse reject(Long id, String reason, String staffEmail) {
        GameRequest request = lockRequest(id); request.reject(reason);
        request.recordProcessor(staff(staffEmail)); return response(request);
    }

    @Transactional
    public GameRequestResponse cancelByStaff(Long id, String reason, String staffEmail) {
        GameRequest request = lockRequest(id); request.cancel(reason);
        request.recordProcessor(staff(staffEmail)); return response(request);
    }

    @Transactional
    public GameRequestResponse cancelByParticipant(String accessToken, Long id) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        GameRequest request = lockRequest(id);
        if (!request.getParticipant().getId().equals(participant.getId()))
            throw new EntityNotFoundException("Game request not found with id: " + id);
        request.cancel(null);
        return response(request);
    }

    public List<GameRequestResponse> forSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) throw new EntityNotFoundException("Session not found with id: " + sessionId);
        return requestRepository.findBySessionIdOrderByRequestedAtAsc(sessionId).stream().map(GameRequestService::response).toList();
    }

    public List<GameRequestResponse> forParticipant(String accessToken) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        return requestRepository.findByParticipantIdOrderByRequestedAtDesc(participant.getId())
                .stream().map(GameRequestService::response).toList();
    }

    public GameRequestResponse findById(Long id) { return response(findRequest(id)); }

    private GameRequest findRequest(Long id) {
        return requestRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Game request not found with id: " + id));
    }
    private GameRequest lockRequest(Long id) {
        return requestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Game request not found with id: " + id));
    }
    private TableSession lockSession(Long id) {
        return sessionLocker.lock(id);
    }
    private StaffUser staff(String email) {
        return staffRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
    }
    private static GameRequestResponse response(GameRequest request) {
        GameCopy copy = request.getGameCopy();
        return new GameRequestResponse(request.getId(), request.getSession().getId(), request.getParticipant().getId(),
                request.getGame().getId(), copy == null ? null : copy.getId(), request.getStatus(),
                request.getRequestedAt(), request.getReservedAt(), request.getDeliveredAt(),
                request.getReturnedAt(), request.getCancelledAt(), request.getResolutionReason(),
                request.getProcessedBy() == null ? null : request.getProcessedBy().getId());
    }
}
