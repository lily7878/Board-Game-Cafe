package ro.boardgamecafe.core.api.staff.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.staff.StaffRole;

public record StaffLoginResponse(String accessToken, String tokenType, Instant expiresAt,
        Long staffId, String fullName, StaffRole role) {}
