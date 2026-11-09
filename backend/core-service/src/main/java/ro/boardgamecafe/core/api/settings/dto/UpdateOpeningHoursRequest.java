package ro.boardgamecafe.core.api.settings.dto;

import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;

/** When closed is true the times must be omitted; otherwise both are required and openTime is before closeTime. */
public record UpdateOpeningHoursRequest(@NotNull Boolean closed, LocalTime openTime, LocalTime closeTime) {}
