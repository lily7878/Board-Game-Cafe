package ro.boardgamecafe.core.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.game.dto.GameCatalogCriteria;
import ro.boardgamecafe.core.api.game.dto.GameCatalogPageResponse;
import ro.boardgamecafe.core.api.game.dto.GameCatalogResponse;
import ro.boardgamecafe.core.api.game.dto.PublicGameCategoryResponse;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.game.GameCategory;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.repository.GameCatalogSpecifications;
import ro.boardgamecafe.core.repository.GameCategoryRepository;
import ro.boardgamecafe.core.repository.GameCopyRepository;
import ro.boardgamecafe.core.repository.GameRepository;

@Service
@Transactional(readOnly = true)
public class GameCatalogService {
    private static final Set<String> SORT_FIELDS = Set.of(
            "title", "minPlayers", "maxPlayers", "durationMinutes", "minimumAge", "difficulty", "createdAt");

    private final GameRepository gameRepository;
    private final GameCategoryRepository categoryRepository;
    private final GameCopyRepository copyRepository;

    public GameCatalogService(GameRepository gameRepository, GameCategoryRepository categoryRepository, GameCopyRepository copyRepository) {
        this.gameRepository = gameRepository;
        this.categoryRepository = categoryRepository;
        this.copyRepository = copyRepository;
    }

    public GameCatalogPageResponse search(GameCatalogCriteria criteria, int page, int size,
            String sortBy, String direction) {
        validate(criteria, page, size, sortBy);
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Sort sort = Sort.by(sortDirection, sortBy).and(Sort.by("id"));
        Page<Game> result = gameRepository.findAll(GameCatalogSpecifications.matching(criteria),
                PageRequest.of(page, size, sort));

        Set<Long> gameIds = result.getContent().stream().map(Game::getId).collect(Collectors.toSet());
        Map<Long, Set<Long>> categoryIds = activeCategoryIds(gameIds);
        Map<Long, Long> availableCounts = availableCopyCounts(gameIds);
        List<GameCatalogResponse> content = result.getContent().stream()
                .map(game -> toResponse(game, categoryIds.getOrDefault(game.getId(), Set.of()),
                        availableCounts.getOrDefault(game.getId(), 0L)))
                .toList();
        return new GameCatalogPageResponse(content, page, size,
                result.getTotalElements(), result.getTotalPages());
    }

    public GameCatalogResponse findById(Long id) {
        Game game = gameRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new EntityNotFoundException("Game not found with id: " + id));
        Set<Long> categoryIds = activeCategoryIds(Set.of(id)).getOrDefault(id, Set.of());
        long availableCopies = copyRepository.countAvailableByGameId(id, CopyCondition.USABLE,
                List.of(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED));
        return toResponse(game, categoryIds, availableCopies);
    }

    public List<PublicGameCategoryResponse> categories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(GameCatalogService::toCategoryResponse).toList();
    }

    private static void validate(GameCatalogCriteria criteria, int page, int size, String sortBy) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Page must be non-negative and size must be between 1 and 100.");
        }
        if (!SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException("Unsupported sort field: " + sortBy);
        }
        if (criteria.categoryId() != null && criteria.categoryId() < 1) {
            throw new IllegalArgumentException("categoryId must be positive.");
        }
        if (criteria.players() != null && criteria.players() < 1) {
            throw new IllegalArgumentException("players must be positive.");
        }
        if (criteria.maxDurationMinutes() != null && criteria.maxDurationMinutes() < 1) {
            throw new IllegalArgumentException("maxDurationMinutes must be positive.");
        }
        if (criteria.age() != null && criteria.age() < 0) {
            throw new IllegalArgumentException("age cannot be negative.");
        }
    }

    private Map<Long, Set<Long>> activeCategoryIds(Set<Long> gameIds) {
        Map<Long, Set<Long>> categoryIds = new HashMap<>();
        if (!gameIds.isEmpty()) {
            for (Object[] row : gameRepository.findActiveCategoryIdsByGameIds(gameIds)) {
                categoryIds.computeIfAbsent((Long) row[0], ignored -> new HashSet<>()).add((Long) row[1]);
            }
        }
        return categoryIds;
    }

    private Map<Long, Long> availableCopyCounts(Set<Long> gameIds) {
        Map<Long, Long> counts = new HashMap<>();
        if (!gameIds.isEmpty()) {
            for (Object[] row : copyRepository.countByGameIdsAndCondition(gameIds, CopyCondition.USABLE,
                    List.of(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED))) {
                counts.put((Long) row[0], (Long) row[1]);
            }
        }
        return counts;
    }

    private static GameCatalogResponse toResponse(Game game, Set<Long> categoryIds, long availableCopies) {
        return new GameCatalogResponse(game.getId(), game.getTitle(), game.getDescription(), game.getShortRules(),
                game.getMinPlayers(), game.getMaxPlayers(), game.getDurationMinutes(), game.getMinimumAge(),
                game.getDifficulty(), Set.copyOf(categoryIds), availableCopies, availableCopies > 0);
    }

    private static PublicGameCategoryResponse toCategoryResponse(GameCategory category) {
        return new PublicGameCategoryResponse(category.getId(), category.getName(), category.getDescription());
    }
}
