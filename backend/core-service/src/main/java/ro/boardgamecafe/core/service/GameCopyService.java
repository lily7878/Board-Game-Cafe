package ro.boardgamecafe.core.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.game.dto.ChangeGameCopyStatusRequest;
import ro.boardgamecafe.core.api.game.dto.CreateGameCopyRequest;
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
    private final GameCopyRepository copyRepository;
    private final GameRepository gameRepository;

    public GameCopyService(GameCopyRepository copyRepository, GameRepository gameRepository) {
        this.copyRepository = copyRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional
    public GameCopyResponse create(Long gameId, CreateGameCopyRequest request) {
        Game game = findGame(gameId);
        String inventoryCode = request.inventoryCode().trim();
        if (copyRepository.existsByInventoryCode(inventoryCode)) {
            throw new DuplicateKeyException("A game copy with this inventory code already exists.");
        }
        GameCopy copy = new GameCopy(game, inventoryCode, request.conditionStatus(), request.notes());
        return toResponse(copyRepository.saveAndFlush(copy));
    }

    public List<GameCopyResponse> findByGame(Long gameId) {
        findGame(gameId);
        return copyRepository.findByGameIdOrderByIdAsc(gameId).stream().map(GameCopyService::toResponse).toList();
    }

    public GameCopyResponse findById(Long id) {
        return toResponse(findCopy(id));
    }

    @Transactional
    public GameCopyResponse changeStatus(Long id, ChangeGameCopyStatusRequest request) {
        GameCopy copy = copyRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Game copy not found with id: " + id));
        copy.changeConditionStatus(request.conditionStatus());
        if (request.notes() != null) {
            copy.changeNotes(request.notes());
        }
        return toResponse(copy);
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

    private static GameCopyResponse toResponse(GameCopy copy) {
        return new GameCopyResponse(copy.getId(), copy.getGame().getId(), copy.getInventoryCode(),
                copy.getConditionStatus(), copy.getNotes(), copy.getCreatedAt());
    }
}
