package ro.boardgamecafe.core.service;

import java.util.EnumSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.billing.dto.BillResponse;
import ro.boardgamecafe.core.domain.billing.Bill;
import ro.boardgamecafe.core.domain.billing.BillCalculator;
import ro.boardgamecafe.core.domain.billing.SessionFee;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.repository.FoodOrderRepository;
import ro.boardgamecafe.core.repository.GameRequestRepository;
import ro.boardgamecafe.core.repository.SessionFeeRepository;
import ro.boardgamecafe.core.repository.SessionParticipantRepository;

/** Loads what a bill needs and delegates the arithmetic to {@link BillCalculator}. */
@Service
@Transactional(readOnly = true)
public class BillService {
    /** Game requests that must be resolved (RETURNED, REJECTED or CANCELLED) before payment. */
    private static final EnumSet<GameRequestStatus> UNRESOLVED_GAME_REQUESTS =
            EnumSet.of(GameRequestStatus.REQUESTED, GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED);

    private final SessionFeeRepository feeRepository;
    private final SessionParticipantRepository participantRepository;
    private final FoodOrderRepository orderRepository;
    private final GameRequestRepository gameRequestRepository;

    public BillService(SessionFeeRepository feeRepository, SessionParticipantRepository participantRepository,
            FoodOrderRepository orderRepository, GameRequestRepository gameRequestRepository) {
        this.feeRepository = feeRepository;
        this.participantRepository = participantRepository;
        this.orderRepository = orderRepository;
        this.gameRequestRepository = gameRequestRepository;
    }

    public Bill compute(TableSession session) {
        Integer persons = feeRepository.findBySessionId(session.getId()).map(SessionFee::getQuantity).orElse(null);
        return BillCalculator.calculate(session.getAccessFeeUnitPrice(), persons,
                participantRepository.findBySessionIdOrderByJoinedAtAsc(session.getId()),
                orderRepository.findBySessionIdOrderByPlacedAtAsc(session.getId()),
                gameRequestRepository.countBySessionIdAndStatusIn(session.getId(), UNRESOLVED_GAME_REQUESTS));
    }

    public BillResponse response(TableSession session) {
        Bill bill = compute(session);
        boolean canEditPersons = session.getStatus() == SessionStatus.ACTIVE && !session.isFeesLocked();
        boolean paymentAllowed = session.getStatus() == SessionStatus.CHECKOUT_PENDING && bill.obstacles().none();
        return new BillResponse(session.getId(), session.getTable().getTableNumber(), session.getStatus(),
                session.isFeesLocked(), bill.accessFeeUnitPrice(), bill.persons(), bill.feesTotal(), bill.menuTotal(),
                bill.total(), bill.pendingOrdersValue(), bill.participants(), bill.obstacles(), canEditPersons,
                paymentAllowed);
    }
}
