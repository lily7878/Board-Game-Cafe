package ro.boardgamecafe.core.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.billing.dto.BillingRequests;
import ro.boardgamecafe.core.api.billing.dto.PaymentResponse;
import ro.boardgamecafe.core.domain.billing.Bill;
import ro.boardgamecafe.core.domain.billing.Payment;
import ro.boardgamecafe.core.domain.billing.PaymentStatus;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.PaymentRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/**
 * T4: simulated payment of the whole bill. Under the session lock it recomputes the total, checks that
 * nothing is left open, stores the single SUCCEEDED payment and closes the session in the same transaction.
 * A request repeated with the same idempotency key returns the stored result instead of paying again.
 */
@Service
@Transactional(readOnly = true)
public class PaymentService {
    /** Outcome of a pay request; created is false when an earlier result was replayed. */
    public record Result(PaymentResponse payment, boolean created) {}

    private final PaymentRepository paymentRepository;
    private final TableSessionRepository sessionRepository;
    private final SessionAccessService accessService;
    private final BillService billService;
    private final SessionLocker sessionLocker;

    public PaymentService(PaymentRepository paymentRepository, TableSessionRepository sessionRepository,
            SessionAccessService accessService, BillService billService, SessionLocker sessionLocker) {
        this.paymentRepository = paymentRepository;
        this.sessionRepository = sessionRepository;
        this.accessService = accessService;
        this.billService = billService;
        this.sessionLocker = sessionLocker;
    }

    @Transactional
    public Result pay(String accessToken, BillingRequests.Pay request) {
        Optional<Payment> earlier = paymentRepository.findByIdempotencyKey(request.idempotencyKey());
        if (earlier.isPresent()) return replay(earlier.get(), accessToken);

        SessionParticipant payer = accessService.authenticate(accessToken);
        TableSession session = sessionLocker.lock(payer.getSession().getId());
        // The same key may have been committed by a concurrent request while we waited for the lock.
        earlier = paymentRepository.findByIdempotencyKey(request.idempotencyKey());
        if (earlier.isPresent()) return replay(earlier.get(), accessToken);

        if (session.getStatus() == SessionStatus.CLOSED
                || paymentRepository.existsBySessionIdAndStatus(session.getId(), PaymentStatus.SUCCEEDED))
            throw new ConflictException("This bill has already been paid.");
        if (session.getStatus() != SessionStatus.CHECKOUT_PENDING)
            throw new ConflictException("Start the checkout before paying.");

        Bill bill = billService.compute(session);
        Bill.Obstacles obstacles = bill.obstacles();
        if (!obstacles.none())
            throw new ConflictException("Payment is not possible yet: %d order(s) in progress, %d game request(s) not returned."
                    .formatted(obstacles.openOrders(), obstacles.unresolvedGameRequests()));
        if (request.expectedTotal() != null && request.expectedTotal().compareTo(bill.total()) != 0)
            throw new ConflictException("The bill total has changed to " + bill.total() + ". Review it before paying.");

        Payment payment = Boolean.TRUE.equals(request.simulateFailure())
                ? Payment.failed(payer, bill.total(), request.idempotencyKey(), "Simulated payment failure.")
                : Payment.succeeded(payer, bill.total(), request.idempotencyKey());
        paymentRepository.save(payment);
        if (payment.getStatus() == PaymentStatus.SUCCEEDED) session.closeAfterPayment();
        paymentRepository.flush();
        return new Result(response(payment), true);
    }

    /** Staff verification of every attempt for a session, also after it was closed. */
    public List<PaymentResponse> forSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId))
            throw new EntityNotFoundException("Session not found with id: " + sessionId);
        return paymentRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(PaymentService::response).toList();
    }

    private Result replay(Payment payment, String accessToken) {
        SessionParticipant caller = accessService.identify(accessToken);
        if (!payment.getInitiatedBy().getId().equals(caller.getId()))
            throw new ConflictException("This idempotency key was already used for another payment.");
        return new Result(response(payment), false);
    }

    private static PaymentResponse response(Payment payment) {
        UUID key = payment.getIdempotencyKey();
        BigDecimal amount = payment.getAmount();
        return new PaymentResponse(payment.getId(), payment.getSession().getId(), payment.getInitiatedBy().getId(),
                payment.getInitiatedBy().getDisplayName(), amount, payment.getStatus(), payment.getMethod(), key,
                payment.getCreatedAt(), payment.getCompletedAt(), payment.getFailureReason(),
                payment.getSession().getStatus());
    }
}
