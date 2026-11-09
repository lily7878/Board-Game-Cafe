package ro.boardgamecafe.core.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.table.dto.LiveViewResponses;
import ro.boardgamecafe.core.domain.billing.SessionFee;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.repository.CafeTableRepository;
import ro.boardgamecafe.core.repository.FoodOrderRepository;
import ro.boardgamecafe.core.repository.OpeningHoursRepository;
import ro.boardgamecafe.core.repository.SessionFeeRepository;
import ro.boardgamecafe.core.repository.SessionOverviewRepository;
import ro.boardgamecafe.core.repository.SessionParticipantRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/** Read models for the live screens: tables grid, session drawer, participant dashboard, cafe info. */
@Service
@Transactional(readOnly = true)
public class LiveViewService {
    private static final ZoneId CAFE_ZONE = ZoneId.of("Europe/Bucharest");
    private static final EnumSet<GameRequestStatus> PENDING_GAMES =
            EnumSet.of(GameRequestStatus.REQUESTED, GameRequestStatus.RESERVED);
    private static final EnumSet<GameRequestStatus> AT_TABLE = EnumSet.of(GameRequestStatus.DELIVERED);
    private static final EnumSet<GameRequestStatus> RESERVED_OR_AT_TABLE =
            EnumSet.of(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED);

    private final CafeTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;
    private final SessionOverviewRepository overview;
    private final SessionParticipantRepository participantRepository;
    private final SessionFeeRepository feeRepository;
    private final FoodOrderRepository orderRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final CafeSettingsService settingsService;
    private final SessionAccessService accessService;

    public LiveViewService(CafeTableRepository tableRepository, TableSessionRepository sessionRepository,
            SessionOverviewRepository overview, SessionParticipantRepository participantRepository,
            SessionFeeRepository feeRepository, FoodOrderRepository orderRepository,
            OpeningHoursRepository openingHoursRepository, CafeSettingsService settingsService,
            SessionAccessService accessService) {
        this.tableRepository = tableRepository;
        this.sessionRepository = sessionRepository;
        this.overview = overview;
        this.participantRepository = participantRepository;
        this.feeRepository = feeRepository;
        this.orderRepository = orderRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.settingsService = settingsService;
        this.accessService = accessService;
    }

    /** Tables grid (1d): every table with its open session, if any, using a fixed number of queries. */
    public List<LiveViewResponses.TableCard> tables() {
        Map<Long, TableSession> sessionByTable = overview.findOpenSessions(SessionStatus.CLOSED).stream()
                .collect(Collectors.toMap(session -> session.getTable().getId(), Function.identity()));
        List<Long> sessionIds = sessionByTable.values().stream().map(TableSession::getId).toList();
        Map<Long, Long> connected = Map.of(), openOrders = Map.of(), atTable = Map.of(), pending = Map.of();
        if (!sessionIds.isEmpty()) {
            connected = counts(overview.countConnectedParticipants(sessionIds));
            openOrders = counts(overview.countOrders(sessionIds, FoodOrderService.OPEN_STATUSES));
            atTable = counts(overview.countGameRequests(sessionIds, AT_TABLE));
            pending = counts(overview.countGameRequests(sessionIds, PENDING_GAMES));
        }
        Map<Long, Long> c = connected, o = openOrders, g = atTable, p = pending;
        return tableRepository.findAll(org.springframework.data.domain.Sort.by("tableNumber")).stream().map(table -> {
            TableSession session = sessionByTable.get(table.getId());
            LiveViewResponses.SessionCard card = session == null ? null : new LiveViewResponses.SessionCard(
                    session.getId(), session.getStatus(), session.getStartedAt(),
                    session.getOpenedBy() == null ? null : session.getOpenedBy().getFullName(),
                    c.getOrDefault(session.getId(), 0L), o.getOrDefault(session.getId(), 0L),
                    g.getOrDefault(session.getId(), 0L), p.getOrDefault(session.getId(), 0L), session.isFeesLocked());
            return new LiveViewResponses.TableCard(table.getId(), table.getTableNumber(), table.getCapacity(),
                    table.getActive(), card);
        }).toList();
    }

    /** Session drawer header, summary and participants tab (1e, 2a, 2d). */
    public LiveViewResponses.SessionDetails session(Long sessionId) {
        TableSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found with id: " + sessionId));
        List<LiveViewResponses.Participant> participants = participantRepository
                .findBySessionIdOrderByJoinedAtAsc(sessionId).stream()
                .map(participant -> new LiveViewResponses.Participant(participant.getId(),
                        participant.getDisplayName(), participant.isActive(), participant.getJoinedAt(),
                        participant.getLeftAt()))
                .toList();
        Integer persons = feeRepository.findBySessionId(sessionId).map(SessionFee::getQuantity).orElse(null);
        long gamesAtTable = counts(overview.countGameRequests(List.of(sessionId), AT_TABLE)).getOrDefault(sessionId, 0L);
        return new LiveViewResponses.SessionDetails(session.getId(), session.getTable().getId(),
                session.getTable().getTableNumber(), session.getTable().getCapacity(), session.getStatus(),
                session.getBusinessDay().getId(), session.getBusinessDay().getDayNumber(),
                session.getBusinessDay().getLabel(), session.getStartedAt(), session.getClosedAt(),
                session.getOpenedBy() == null ? null : session.getOpenedBy().getFullName(),
                session.getAccessFeeUnitPrice(), session.isFeesLocked(), persons, gamesAtTable,
                settingsService.current().getMaxDeliveredGamesPerTable(), participants);
    }

    /** Participant dashboard (3b): table mates, activity counters and the games at the table. */
    public LiveViewResponses.CurrentSession currentForParticipant(String accessToken) {
        SessionParticipant me = accessService.authenticate(accessToken);
        TableSession session = me.getSession();
        Long sessionId = session.getId();
        List<LiveViewResponses.TableMate> mates = participantRepository.findBySessionIdOrderByJoinedAtAsc(sessionId)
                .stream().filter(SessionParticipant::isActive)
                .map(participant -> new LiveViewResponses.TableMate(participant.getId(),
                        participant.getDisplayName(), participant.getId().equals(me.getId())))
                .toList();
        long activeOrders = orderRepository.countBySessionIdAndStatusIn(sessionId, FoodOrderService.OPEN_STATUSES);
        long myActiveOrders = orderRepository.countByParticipantIdAndStatusIn(me.getId(), FoodOrderService.OPEN_STATUSES);
        List<LiveViewResponses.GameAtTable> games = overview.findGamesOfSession(sessionId, RESERVED_OR_AT_TABLE)
                .stream().map(request -> new LiveViewResponses.GameAtTable(request.getId(), request.getGame().getId(),
                        request.getGame().getTitle(), request.getStatus()))
                .toList();
        long gamesAtTable = games.stream().filter(game -> game.status() == GameRequestStatus.DELIVERED).count();
        return new LiveViewResponses.CurrentSession(sessionId, me.getId(), me.getDisplayName(), me.getJoinedAt(),
                session.getTable().getTableNumber(), session.getStatus(), session.isFeesLocked(), mates,
                activeOrders, myActiveOrders, games, gamesAtTable,
                settingsService.current().getMaxDeliveredGamesPerTable());
    }

    /** Public: cafe name and the informative weekly schedule. */
    public LiveViewResponses.CafeInfo cafeInfo() {
        List<LiveViewResponses.Hours> hours = openingHoursRepository.findAllByOrderByDayOfWeekAsc().stream()
                .map(day -> new LiveViewResponses.Hours(day.getDayOfWeek(), day.isClosed(), day.getOpenTime(),
                        day.getCloseTime()))
                .toList();
        return new LiveViewResponses.CafeInfo(settingsService.current().getCafeName(),
                LocalDate.now(CAFE_ZONE).getDayOfWeek().getValue(), hours);
    }

    private static Map<Long, Long> counts(Collection<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) counts.put((Long) row[0], (Long) row[1]);
        return counts;
    }
}
