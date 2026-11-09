package ro.boardgamecafe.core.api.table.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.domain.table.SessionStatus;

/** Read models for the live screens of both UIs. They never contain QR tokens or PINs. */
public final class LiveViewResponses {
    private LiveViewResponses() {
    }

    /** One card of the tables grid (1d); session is null for a free table. */
    public record TableCard(Long tableId, int tableNumber, int capacity, boolean active, SessionCard session) {}

    /**
     * openOrders: orders not yet delivered or cancelled. gamesAtTable: DELIVERED requests (count toward the
     * limit). pendingGameRequests: REQUESTED or RESERVED.
     */
    public record SessionCard(Long sessionId, SessionStatus status, Instant startedAt, String openedBy,
            long connectedParticipants, long openOrders, long gamesAtTable, long pendingGameRequests,
            boolean feesLocked) {}

    /** Session drawer (1e, 2a, 2d): everything except orders, games and bill, which have their own endpoints. */
    public record SessionDetails(Long sessionId, Long tableId, int tableNumber, int capacity, SessionStatus status,
            Long businessDayId, int dayNumber, String dayLabel, Instant startedAt, Instant closedAt, String openedBy,
            BigDecimal accessFeeUnitPrice, boolean feesLocked, Integer persons, long gamesAtTable,
            int maxDeliveredGames, List<Participant> participants) {}

    public record Participant(Long participantId, String displayName, boolean active, Instant joinedAt,
            Instant leftAt) {}

    /** Participant dashboard (3b): the table as seen from one phone. */
    public record CurrentSession(Long sessionId, Long participantId, String displayName, Instant joinedAt,
            int tableNumber, SessionStatus status, boolean feesLocked, List<TableMate> participants,
            long activeOrders, long myActiveOrders, List<GameAtTable> games, long gamesAtTable,
            int maxDeliveredGames) {}

    public record TableMate(Long participantId, String displayName, boolean me) {}

    public record GameAtTable(Long requestId, Long gameId, String title, GameRequestStatus status) {}

    /** Shown on the join screen (3a) before the PIN is entered. */
    public record JoinInfo(int tableNumber) {}

    /** Public cafe information for the participant menu (3c). todayDayOfWeek uses Europe/Bucharest. */
    public record CafeInfo(String cafeName, int todayDayOfWeek, List<Hours> openingHours) {}

    public record Hours(int dayOfWeek, boolean closed, LocalTime openTime, LocalTime closeTime) {}

    public record JoinInfoRequest(@jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(max = 128) String joinToken) {}
}
