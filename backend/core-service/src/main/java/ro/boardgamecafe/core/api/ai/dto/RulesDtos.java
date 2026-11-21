package ro.boardgamecafe.core.api.ai.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ro.boardgamecafe.core.domain.game.RuleDocumentStatus;

public final class RulesDtos {
    private RulesDtos() {}

    /** Management view of a game's manual. latest is the newest not-removed upload (may still be processing). */
    public record AdminRules(boolean available, RuleDocumentResponse latest) {}

    public record RuleDocumentResponse(Long id, String fileName, long sizeBytes, Integer pageCount,
            RuleDocumentStatus status, String failureReason, boolean active, Instant uploadedAt, String uploadedBy,
            Instant processedAt) {}

    public record RulesStatus(boolean available) {}

    public record Turn(
            @NotNull @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 1500) String content) {}

    public record AskRequest(
            @NotBlank @Size(max = 300) String question,
            @Size(max = 4) List<@Valid Turn> history) {}

    public record Citation(int page, String excerpt) {}

    /** found = false means the manual does not cover the question; answer then says to ask the staff. */
    public record AskResponse(String answer, boolean found, List<Citation> citations) {}
}
