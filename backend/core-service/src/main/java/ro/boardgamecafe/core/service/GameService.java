package ro.boardgamecafe.core.service;

import ro.boardgamecafe.core.live.LiveEvents;

import java.util.Map;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.repository.GameCopyRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.game.GameCategory;
import ro.boardgamecafe.core.api.game.dto.CreateGameRequest;
import ro.boardgamecafe.core.api.game.dto.UpdateGameRequest;
import ro.boardgamecafe.core.api.game.dto.GameResponse;
import ro.boardgamecafe.core.repository.GameRepository;
import ro.boardgamecafe.core.repository.GameCategoryRepository;

@Service
@Transactional(readOnly = true)
public class GameService {
    private final LiveEvents events;

        private final GameRepository gameRepository;
        private static final List<GameRequestStatus> OCCUPIED =
                        List.of(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED);

        private final GameCategoryRepository gameCategoryRepository;
        private final GameCopyRepository copyRepository;

        public GameService(
                        GameRepository gameRepository,
                        GameCategoryRepository gameCategoryRepository,
                        GameCopyRepository copyRepository, LiveEvents events) {
        this.events = events;

                this.gameRepository = gameRepository;
                this.gameCategoryRepository = gameCategoryRepository;
                this.copyRepository = copyRepository;
        }

        @Transactional
        public GameResponse createGame(CreateGameRequest request) {
                events.catalog("games.changed", null);

                Set<GameCategory> categories = resolveCategories(request.categoryIds());

                Game game = new Game(
                                request.title(),
                                request.description(),
                                request.shortRules(),
                                request.minPlayers(),
                                request.maxPlayers(),
                                request.durationMinutes(),
                                request.minimumAge(),
                                request.difficulty(),
                                categories);

                game.changeMaxDuration(request.maxDurationMinutes());
                Game savedGame = gameRepository.save(game);

                return toResponse(savedGame);
        }

        public List<GameResponse> getAllGames() {

                List<Game> games = gameRepository.findAll(org.springframework.data.domain.Sort.by("title", "id"));
                Set<Long> ids = games.stream().map(Game::getId).collect(Collectors.toSet());
                Map<Long, Long> total = counts(ids.isEmpty() ? List.of() : copyRepository.countAllByGameIds(ids));
                Map<Long, Long> available = counts(ids.isEmpty() ? List.of()
                                : copyRepository.countByGameIdsAndCondition(ids, CopyCondition.USABLE, OCCUPIED));
                return games.stream()
                                .map(game -> toResponse(game, total.getOrDefault(game.getId(), 0L),
                                                available.getOrDefault(game.getId(), 0L)))
                                .toList();
        }

        public GameResponse getGameById(Long id) {

                Game game = findGameById(id);

                return toResponse(game);
        }

        @Transactional
        public GameResponse updateGame(Long id, UpdateGameRequest request) {
                events.catalog("games.changed", null);

                Game game = findGameById(id);

                game.updateDetails(
                                request.title() != null
                                                ? request.title()
                                                : game.getTitle(),

                                request.description() != null
                                                ? request.description()
                                                : game.getDescription(),

                                request.shortRules() != null
                                                ? request.shortRules()
                                                : game.getShortRules(),

                                request.minPlayers() != null
                                                ? request.minPlayers()
                                                : game.getMinPlayers(),

                                request.maxPlayers() != null
                                                ? request.maxPlayers()
                                                : game.getMaxPlayers(),

                                request.durationMinutes() != null
                                                ? request.durationMinutes()
                                                : game.getDurationMinutes(),

                                request.minimumAge() != null
                                                ? request.minimumAge()
                                                : game.getMinimumAge(),

                                request.difficulty() != null
                                                ? request.difficulty()
                                                : game.getDifficulty());

                game.changeMaxDuration(request.maxDurationMinutes() != null
                                ? request.maxDurationMinutes()
                                : game.getMaxDurationMinutes());

                if (request.categoryIds() != null) {
                        Set<GameCategory> categories = resolveCategories(request.categoryIds());

                        game.replaceCategories(categories);
                }

                return toResponse(game);
        }

        @Transactional
        public GameResponse setGameActive(Long id, boolean active) {
                events.catalog("games.changed", null);

                Game game = findGameById(id);

                if (active) {
                        game.activate();
                } else {
                        game.deactivate();
                }

                return toResponse(game);
        }

        private Game findGameById(Long id) {

                return gameRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Game not found with id: " + id));
        }

        private Set<GameCategory> resolveCategories(Set<Long> categoryIds) {

                if (categoryIds == null || categoryIds.isEmpty()) {
                        return new HashSet<>();
                }

                if (categoryIds.contains(null)) {
                        throw new IllegalArgumentException(
                                        "Category IDs cannot contain null.");
                }

                List<GameCategory> categories = gameCategoryRepository.findAllById(categoryIds);

                Set<Long> foundIds = categories.stream()
                                .map(GameCategory::getId)
                                .collect(Collectors.toSet());

                if (!foundIds.containsAll(categoryIds)) {
                        throw new EntityNotFoundException(
                                        "One or more game categories were not found.");
                }

                return new HashSet<>(categories);
        }

        private static Map<Long, Long> counts(List<Object[]> rows) {
                Map<Long, Long> counts = new java.util.HashMap<>();
                for (Object[] row : rows) counts.put((Long) row[0], (Long) row[1]);
                return counts;
        }

        private GameResponse toResponse(Game game) {
                Set<Long> id = Set.of(game.getId());
                return toResponse(game,
                                counts(copyRepository.countAllByGameIds(id)).getOrDefault(game.getId(), 0L),
                                copyRepository.countAvailableByGameId(game.getId(), CopyCondition.USABLE, OCCUPIED));
        }

        private GameResponse toResponse(Game game, long totalCopies, long availableCopies) {

                Set<Long> categoryIds = game.getCategories()
                                .stream()
                                .map(GameCategory::getId)
                                .collect(Collectors.toSet());

                return new GameResponse(
                                game.getId(),
                                game.getTitle(),
                                game.getDescription(),
                                game.getShortRules(),
                                game.getMinPlayers(),
                                game.getMaxPlayers(),
                                game.getDurationMinutes(),
                                game.getMaxDurationMinutes(),
                                game.getMinimumAge(),
                                game.getDifficulty(),
                                game.getActive(),
                                game.getCreatedAt(),
                                categoryIds,
                                totalCopies,
                                availableCopies);
        }
}
