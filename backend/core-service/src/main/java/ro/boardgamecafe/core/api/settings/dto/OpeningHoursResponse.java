package ro.boardgamecafe.core.api.settings.dto;

import java.time.LocalTime;

public record OpeningHoursResponse(int dayOfWeek, boolean closed, LocalTime openTime, LocalTime closeTime) {}
