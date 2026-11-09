package ro.boardgamecafe.core.api.settings.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record UpdateCafeSettingsRequest(
        @NotBlank @Size(max = 100) String cafeName,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal accessFeePrice,
        @NotNull @Min(1) @Max(50) Integer maxDeliveredGamesPerTable) {}
