package ro.boardgamecafe.core.api.staff.dto;

import jakarta.validation.constraints.NotNull;
public record ChangeStaffStatusRequest(@NotNull Boolean active) {}
