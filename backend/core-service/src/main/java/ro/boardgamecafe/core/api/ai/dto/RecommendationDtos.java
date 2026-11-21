package ro.boardgamecafe.core.api.ai.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import ro.boardgamecafe.core.api.game.dto.GameCatalogResponse;

public final class RecommendationDtos {
    private RecommendationDtos() {}

    public enum Mood { FUN, RELAXED, TEAM, SERIOUS }

    /** Where the list came from: the AI ranking, or the deterministic list used when AI is unavailable. */
    public enum Source { AI, FALLBACK }

    public record RecommendationRequest(
            @NotNull @Min(1) @Max(20) Integer players,
            @NotNull Mood mood,
            @Min(1) Integer maxDurationMinutes) {}

    /** explanation is null for FALLBACK items. */
    public record RecommendationItem(GameCatalogResponse game, String explanation) {}

    public record RecommendationResponse(Source source, List<RecommendationItem> items) {}
}
