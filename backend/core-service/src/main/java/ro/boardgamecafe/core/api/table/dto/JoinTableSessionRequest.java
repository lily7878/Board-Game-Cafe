package ro.boardgamecafe.core.api.table.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinTableSessionRequest(
        @NotBlank @Size(max = 128) String joinToken,
        @NotBlank @Size(min = 6, max = 6) String pin,
        @NotBlank @Size(max = 80) String displayName
) {}
