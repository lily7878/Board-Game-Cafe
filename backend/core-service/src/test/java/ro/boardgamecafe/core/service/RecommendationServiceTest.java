package ro.boardgamecafe.core.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.Mood;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationItem;
import ro.boardgamecafe.core.api.game.dto.GameCatalogResponse;
import ro.boardgamecafe.core.domain.game.GameDifficulty;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRecommendation;

class RecommendationServiceTest {
    private static final Map<Long, String> CATEGORIES = Map.of(1L, "Cooperativ", 2L, "Party");

    private static GameCatalogResponse game(long id, String title, GameDifficulty difficulty, Set<Long> categories) {
        return new GameCatalogResponse(id, title, "desc", null, 2, 4, 30, null, 8, difficulty, categories, 1, true);
    }

    private final GameCatalogResponse zombi = game(1, "Zombi", GameDifficulty.HARD, Set.of());
    private final GameCatalogResponse pandemic = game(2, "Pandemic", GameDifficulty.MEDIUM, Set.of(1L));
    private final GameCatalogResponse dixit = game(3, "Dixit", GameDifficulty.EASY, Set.of(2L));

    @Test
    void fallbackPutsMoodMatchesFirstThenAlphabetical() {
        List<GameCatalogResponse> result = RecommendationService.fallback(List.of(zombi, pandemic, dixit), Mood.TEAM, CATEGORIES);
        assertThat(result).extracting(GameCatalogResponse::title).containsExactly("Pandemic", "Dixit", "Zombi");

        result = RecommendationService.fallback(List.of(zombi, pandemic, dixit), Mood.SERIOUS, CATEGORIES);
        assertThat(result).extracting(GameCatalogResponse::title).containsExactly("Pandemic", "Zombi", "Dixit");
    }

    @Test
    void validateDropsUnknownDuplicateAndBlankItems() {
        List<RecommendationItem> result = RecommendationService.validate(List.of(
                new AiRecommendation(2L, " Jucați împreună. "),
                new AiRecommendation(99L, "Joc inventat."),
                new AiRecommendation(2L, "Duplicat."),
                new AiRecommendation(3L, "   "),
                new AiRecommendation(null, "Fără id."),
                new AiRecommendation(1L, "Pentru cei curajoși.")), List.of(zombi, pandemic, dixit));

        assertThat(result).extracting(item -> item.game().id()).containsExactly(2L, 1L);
        assertThat(result.getFirst().explanation()).isEqualTo("Jucați împreună.");
    }

    @Test
    void validateKeepsAtMostFiveItems() {
        List<GameCatalogResponse> games = java.util.stream.LongStream.rangeClosed(1, 8)
                .mapToObj(id -> game(id, "G" + id, GameDifficulty.EASY, Set.of())).toList();
        List<AiRecommendation> ai = games.stream().map(g -> new AiRecommendation(g.id(), "ok")).toList();
        assertThat(RecommendationService.validate(ai, games)).hasSize(RecommendationService.MAX_AI_ITEMS);
    }

    @Test
    void validateWithNoAnswerIsEmpty() {
        assertThat(RecommendationService.validate(null, List.of(zombi))).isEmpty();
    }
}
