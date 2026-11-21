package ro.boardgamecafe.core.service;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.Mood;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationItem;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationRequest;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationResponse;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.Source;
import ro.boardgamecafe.core.api.game.dto.GameCatalogCriteria;
import ro.boardgamecafe.core.api.game.dto.GameCatalogResponse;
import ro.boardgamecafe.core.api.game.dto.PublicGameCategoryResponse;
import ro.boardgamecafe.core.domain.game.GameDifficulty;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.integration.ai.AiServiceClient;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRecommendation;

/**
 * Core decides which games are eligible (active, a free copy now, fits players and time); the AI may only
 * reorder and explain those. Without a usable AI answer the deterministic fallback is returned, labelled as such.
 */
@Service
public class RecommendationService {
    static final int MAX_AI_ITEMS = 5;
    static final int MAX_CANDIDATES = 40;
    static final int MAX_EXPLANATION_CHARS = 300;
    private static final int MAX_DESCRIPTION_CHARS = 600;

    private final SessionAccessService accessService;
    private final GameCatalogService catalogService;
    private final AiServiceClient aiClient;

    public RecommendationService(SessionAccessService accessService, GameCatalogService catalogService,
            AiServiceClient aiClient) {
        this.accessService = accessService;
        this.catalogService = catalogService;
        this.aiClient = aiClient;
    }

    public RecommendationResponse recommend(String participantToken, RecommendationRequest request) {
        SessionParticipant participant = accessService.authenticate(participantToken);
        if (participant.getSession().getStatus() != SessionStatus.ACTIVE)
            throw new ConflictException("Recommendations are available only while the session is active.");

        // Read-only lookups, outside a transaction on purpose: the AI call below may take seconds.
        List<GameCatalogResponse> eligible = catalogService.search(new GameCatalogCriteria(
                null, request.players(), request.maxDurationMinutes(), null, null, true),
                0, 100, "title", "ASC").content();
        if (eligible.isEmpty()) return new RecommendationResponse(Source.FALLBACK, List.of());

        Map<Long, String> categoryNames = catalogService.categories().stream()
                .collect(Collectors.toMap(PublicGameCategoryResponse::id, PublicGameCategoryResponse::name));
        List<GameCatalogResponse> fallback = fallback(eligible, request.mood(), categoryNames);

        List<AiServiceClient.Candidate> candidates = fallback.stream().limit(MAX_CANDIDATES)
                .map(game -> toCandidate(game, categoryNames)).toList();
        Optional<List<AiRecommendation>> aiItems = aiClient.recommend(new AiServiceClient.AiRecommendationRequest(
                new AiServiceClient.Answers(request.players(), request.mood().name(), request.maxDurationMinutes()),
                candidates));

        List<RecommendationItem> validated = aiItems.map(items -> validate(items, fallback.subList(0, candidates.size())))
                .orElse(List.of());
        if (!validated.isEmpty()) return new RecommendationResponse(Source.AI, validated);
        return new RecommendationResponse(Source.FALLBACK,
                fallback.stream().map(game -> new RecommendationItem(game, null)).toList());
    }

    /**
     * Eligible games that match the mood first, then the rest; alphabetical inside each group.
     * Games that do not match the mood stay in the list so a narrow mood never empties it.
     */
    static List<GameCatalogResponse> fallback(List<GameCatalogResponse> eligible, Mood mood,
            Map<Long, String> categoryNames) {
        Collator collator = Collator.getInstance(Locale.forLanguageTag("ro"));
        Comparator<GameCatalogResponse> order = Comparator
                .comparing((GameCatalogResponse game) -> !matchesMood(game, mood, categoryNames))
                .thenComparing(GameCatalogResponse::title, collator)
                .thenComparing(GameCatalogResponse::id);
        return eligible.stream().filter(GameCatalogResponse::available).sorted(order).toList();
    }

    static boolean matchesMood(GameCatalogResponse game, Mood mood, Map<Long, String> categoryNames) {
        return switch (mood) {
            case FUN -> game.difficulty() == GameDifficulty.EASY;
            case RELAXED -> game.difficulty() != GameDifficulty.HARD;
            case SERIOUS -> game.difficulty() != GameDifficulty.EASY;
            case TEAM -> game.categoryIds().stream().map(categoryNames::get)
                    .anyMatch(name -> name != null && name.toLowerCase(Locale.ROOT).contains("coop"));
        };
    }

    /** Keeps only games Core proposed, once each, with a non-blank explanation; at most MAX_AI_ITEMS. */
    static List<RecommendationItem> validate(List<AiRecommendation> aiItems, List<GameCatalogResponse> candidates) {
        if (aiItems == null) return List.of();
        Map<Long, GameCatalogResponse> byId = candidates.stream()
                .collect(Collectors.toMap(GameCatalogResponse::id, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        Set<Long> seen = new HashSet<>();
        List<RecommendationItem> result = new ArrayList<>();
        for (AiRecommendation item : aiItems) {
            if (item == null || item.gameId() == null || item.explanation() == null) continue;
            GameCatalogResponse game = byId.get(item.gameId());
            String explanation = item.explanation().strip();
            if (game == null || explanation.isEmpty() || !seen.add(item.gameId())) continue;
            if (explanation.length() > MAX_EXPLANATION_CHARS)
                explanation = explanation.substring(0, MAX_EXPLANATION_CHARS);
            result.add(new RecommendationItem(game, explanation));
            if (result.size() == MAX_AI_ITEMS) break;
        }
        return result;
    }

    private static AiServiceClient.Candidate toCandidate(GameCatalogResponse game, Map<Long, String> categoryNames) {
        List<String> categories = game.categoryIds().stream().map(categoryNames::get)
                .filter(name -> name != null).sorted().toList();
        String description = game.description() == null ? "" : game.description();
        if (description.length() > MAX_DESCRIPTION_CHARS) description = description.substring(0, MAX_DESCRIPTION_CHARS);
        return new AiServiceClient.Candidate(game.id(), game.title(), categories, game.minPlayers(),
                game.maxPlayers(), game.durationMinutes(), game.maxDurationMinutes(), game.difficulty().name(),
                description);
    }
}
