package ro.boardgamecafe.core.api.table.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** New sessions use a 4-digit PIN; 6 digits are still accepted for sessions opened before the change. */
public record JoinTableSessionRequest(
        @NotBlank @Size(max = 128) String joinToken,
        @NotBlank @Pattern(regexp = "\\d{4}|\\d{6}", message = "PIN must have 4 digits") String pin,
        @NotBlank @Size(max = 80) String displayName
) {}
