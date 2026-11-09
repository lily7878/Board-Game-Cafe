package ro.boardgamecafe.core.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.billing.dto.BillResponse;
import ro.boardgamecafe.core.domain.billing.SessionFee;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.SessionFeeRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/**
 * Declared persons, the shared bill, checkout (T3) and reopening (T5). Every state change locks the
 * session row first, so it is serialized with placing orders, game requests and payment.
 */
@Service
@Transactional(readOnly = true)
public class CheckoutService {
    private final TableSessionRepository sessionRepository;
    private final SessionFeeRepository feeRepository;
    private final StaffUserRepository staffRepository;
    private final SessionAccessService accessService;
    private final BillService billService;
    private final SessionLocker sessionLocker;

    public CheckoutService(TableSessionRepository sessionRepository, SessionFeeRepository feeRepository,
            StaffUserRepository staffRepository, SessionAccessService accessService, BillService billService,
            SessionLocker sessionLocker) {
        this.sessionRepository = sessionRepository;
        this.feeRepository = feeRepository;
        this.staffRepository = staffRepository;
        this.accessService = accessService;
        this.billService = billService;
        this.sessionLocker = sessionLocker;
    }

    public BillResponse billForParticipant(String accessToken) {
        return billService.response(accessService.authenticate(accessToken).getSession());
    }

    public BillResponse billForStaff(Long sessionId) {
        return billService.response(sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found with id: " + sessionId)));
    }

    /** Any participant may declare the number of people, but only before the first checkout. */
    @Transactional
    public BillResponse declarePersons(String accessToken, int persons) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        TableSession session = lockSession(participant.getSession().getId());
        if (session.getStatus() != SessionStatus.ACTIVE || session.isFeesLocked())
            throw new ConflictException("The number of people is locked after the first checkout. Ask the staff.");
        feeRepository.findBySessionId(session.getId()).ifPresentOrElse(
                fee -> fee.setByParticipant(participant, persons),
                () -> feeRepository.save(SessionFee.declaredByParticipant(session, participant, persons)));
        feeRepository.flush();
        return billService.response(session);
    }

    /** Staff correction, allowed while the session is active (also after a reopen). */
    @Transactional
    public BillResponse setPersonsByStaff(Long sessionId, int persons, String staffEmail) {
        TableSession session = lockSession(sessionId);
        if (session.getStatus() != SessionStatus.ACTIVE)
            throw new ConflictException("Reopen the session before correcting the number of people.");
        StaffUser staff = staff(staffEmail);
        feeRepository.findBySessionId(session.getId()).ifPresentOrElse(
                fee -> fee.setByStaff(staff, persons),
                () -> feeRepository.save(SessionFee.declaredByStaff(session, staff, persons)));
        feeRepository.flush();
        return billService.response(session);
    }

    /** T3: requires at least one declared person; afterwards no new orders or game requests are accepted. */
    @Transactional
    public BillResponse checkout(String accessToken) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        TableSession session = lockSession(participant.getSession().getId());
        if (feeRepository.findBySessionId(session.getId()).isEmpty())
            throw new ConflictException("Declare the number of people (at least 1) before checkout.");
        session.startCheckout();
        sessionRepository.flush();
        return billService.response(session);
    }

    /** T5: back to ACTIVE before a successful payment; the fees stay locked for participants. */
    @Transactional
    public BillResponse reopen(Long sessionId) {
        TableSession session = lockSession(sessionId);
        session.reopen();
        sessionRepository.flush();
        return billService.response(session);
    }

    private TableSession lockSession(Long id) {
        return sessionLocker.lock(id);
    }

    private StaffUser staff(String email) {
        return staffRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
    }
}
