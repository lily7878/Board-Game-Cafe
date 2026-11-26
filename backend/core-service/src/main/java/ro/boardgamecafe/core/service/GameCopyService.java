package ro.boardgamecafe.core.service;

import ro.boardgamecafe.core.live.LiveEvents;

import ro.boardgamecafe.core.repository.GameRequestRepository;

import ro.boardgamecafe.core.domain.game.GameRequestStatus;

import ro.boardgamecafe.core.domain.game.GameRequest;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.game.dto.ChangeGameCopyStatusRequest;
import ro.boardgamecafe.core.api.game.dto.CreateGameCopiesRequest;
import ro.boardgamecafe.core.api.game.dto.CreateGameCopyRequest;
import ro.boardgamecafe.core.domain.game.InventoryCodes;
import ro.boardgamecafe.core.api.game.dto.GameCopyResponse;
import ro.boardgamecafe.core.api.game.dto.GameCopySummaryResponse;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.game.GameCopy;
import ro.boardgamecafe.core.repository.GameCopyRepository;
import ro.boardgamecafe.core.repository.GameRepository;

@Service
@Transactional(readOnly = true)
public class GameCopyService {
    private final LiveEvents events;
    private final GameCopyRepository copyRepository;
    private static final List<GameRequestStatus> ACTIVE = List.of(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED);
    private final GameRepository gameRepository;
    private final GameRequestRepository requestRepository;

    public GameCopyService(GameCopyRepository copyRepository, GameRepository gameRepository,
            GameRequestRepository requestRepository, LiveEvents events) {
        this.events = events;
        this.copyRepository = copyRepository;
        this.gameRepository = gameRepository;
        this.requestRepository = requestRepository;
    }

    /** All copies, optionally filtered by inventory code / title and by physical condition. */
    public List<GameCopyResponse> search(String text, CopyCondition condition) {
        String pattern = text == null || text.isBlank() ? null
                : "%" + text.strip().toLowerCase(java.util.Locale.ROOT) + "%";
        return withLocations(copyRepository.search(pattern, condition));
    }

    @Transactional
    public GameCopyResponse create(Long gameId, CreateGameCopyRequest request) {
        events.catalog("games.availability-changed", null);
        Game game = findGame(gameId);
        String inventoryCode = request.inventoryCode().trim();
        if (copyRepository.existsByInventoryCode(inventoryCode)) {
            throw new DuplicateKeyException("A game copy with this inventory code already exists.");
        }
        GameCopy copy = new GameCopy(game, inventoryCode, request.conditionStatus(), request.notes());
        return withLocations(List.of(copyRepository.saveAndFlush(copy))).get(0);
    }

    /**
     * Adds several copies at once with generated codes (PREFIX-NN). The game row is locked so two batches
     * for the same game cannot produce the same numbers; a clash with another game's codes is a 409.
     */
    @Transactional
    public List<GameCopyResponse> createMany(Long gameId, CreateGameCopiesRequest request) {
        Game game = gameRepository.findByIdForUpdate(gameId)
                .orElseThrow(() -> new EntityNotFoundException("Game not found with id: " + gameId));
        String prefix = request.codePrefix() == null || request.codePrefix().isBlank()
                ? InventoryCodes.defaultPrefix(game.getTitle())
                : request.codePrefix().strip().toUpperCase(java.util.Locale.ROOT);
        List<String> codes = InventoryCodes.next(prefix, copyRepository.findCodesStartingWith(prefix + "-%"),
                request.quantity());
        CopyCondition condition = request.conditionStatus() == null ? CopyCondition.USABLE : request.conditionStatus();
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().strip();
        List<GameCopy> saved = copyRepository.saveAllAndFlush(
                codes.stream().map(code -> new GameCopy(game, code, condition, notes)).toList());
        events.catalog("games.availability-changed", gameId);
        return withLocations(saved);
    }

    public List<GameCopyResponse> findByGame(Long gameId) {
        findGame(gameId);
        return withLocations(copyRepository.findByGameIdOrderByIdAsc(gameId));
    }

    public GameCopyResponse findById(Long id) {
        return withLocations(List.of(findCopy(id))).get(0);
    }

    @Transactional
    public GameCopyResponse changeStatus(Long id, ChangeGameCopyStatusRequest request) {
        events.catalog("games.availability-changed", null);
        GameCopy copy = copyRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Game copy not found with id: " + id));
        copy.changeConditionStatus(request.conditionStatus());
        if (request.notes() != null) {
            copy.changeNotes(request.notes());
        }
        return withLocations(List.of(copy)).get(0);
    }

    public GameCopySummaryResponse summary(Long gameId) {
        findGame(gameId);
        List<GameCopy> copies = copyRepository.findByGameIdOrderByIdAsc(gameId);
        long usable = copies.stream().filter(copy -> copy.getConditionStatus() == CopyCondition.USABLE).count();
        long maintenance = copies.stream().filter(copy -> copy.getConditionStatus() == CopyCondition.UNDER_MAINTENANCE)
                .count();
        long unavailable = copies.stream().filter(copy -> copy.getConditionStatus() == CopyCondition.UNAVAILABLE)
                .count();
        return new GameCopySummaryResponse(gameId, copies.size(), usable, maintenance, unavailable);
    }

    private Game findGame(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Game not found with id: " + id));
    }

    private GameCopy findCopy(Long id) {
        return copyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Game copy not found with id: " + id));
    }

    private List<GameCopyResponse> withLocations(List<GameCopy> copies) {
        java.util.Map<Long, GameRequest> active = new java.util.HashMap<>();
        if (!copies.isEmpty()) {
            for (GameRequest request : requestRepository.findActiveForCopies(
                    copies.stream().map(GameCopy::getId).toList(), ACTIVE))
                active.put(request.getGameCopy().getId(), request);
        }
        return copies.stream().map(copy -> toResponse(copy, active.get(copy.getId()))).toList();
    }

    private static GameCopyResponse toResponse(GameCopy copy, GameRequest activeRequest) {
        return new GameCopyResponse(copy.getId(), copy.getGame().getId(), copy.getGame().getTitle(),
                copy.getInventoryCode(), copy.getConditionStatus(), copy.getNotes(), copy.getCreatedAt(),
                activeRequest == null ? null : activeRequest.getId(),
                activeRequest == null ? null : activeRequest.getStatus(),
                activeRequest == null ? null : activeRequest.getSession().getTable().getTableNumber());
    }
}
