package ro.boardgamecafe.core.api.billing.dto;

import java.math.BigDecimal;
import java.util.List;
import ro.boardgamecafe.core.domain.billing.Bill;
import ro.boardgamecafe.core.domain.table.SessionStatus;

/**
 * The shared bill as shown to participants and staff.
 * canEditPersons: participants may still declare the number of people (ACTIVE and fees not locked).
 * paymentAllowed: the session is in checkout and nothing blocks the payment.
 */
public record BillResponse(Long sessionId, Integer tableNumber, SessionStatus sessionStatus, boolean feesLocked,
        BigDecimal accessFeeUnitPrice, Integer persons, BigDecimal feesTotal, BigDecimal menuTotal, BigDecimal total,
        BigDecimal pendingOrdersValue, List<Bill.ParticipantShare> participants, Bill.Obstacles obstacles,
        boolean canEditPersons, boolean paymentAllowed) {}
