package ro.boardgamecafe.core.service;

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

        private final GameRepository gameRepository;
        private final GameCategoryRepository gameCategoryRepository;

        public GameService(
                        GameRepository gameRepository,
                        GameCategoryRepository gameCategoryRepository) {

                this.gameRepository = gameRepository;
                this.gameCategoryRepository = gameCategoryRepository;
        }

        @Transactional
        public GameResponse createGame(CreateGameRequest request) {

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

                Game savedGame = gameRepository.save(game);

                return toResponse(savedGame);
        }

        public List<GameResponse> getAllGames() {

                return gameRepository.findAll()
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        public GameResponse getGameById(Long id) {

                Game game = findGameById(id);

                return toResponse(game);
        }

        @Transactional
        public GameResponse updateGame(Long id, UpdateGameRequest request) {

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

                if (request.categoryIds() != null) {
                        Set<GameCategory> categories = resolveCategories(request.categoryIds());

                        game.replaceCategories(categories);
                }

                return toResponse(game);
        }

        @Transactional
        public GameResponse setGameActive(Long id, boolean active) {

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

        private GameResponse toResponse(Game game) {

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
                                game.getMinimumAge(),
                                game.getDifficulty(),
                                game.getActive(),
                                game.getCreatedAt(),
                                categoryIds);
        }
}
