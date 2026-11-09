package ro.boardgamecafe.core.api.staff.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.staff.StaffRole;

public record StaffUserResponse(Long id, String fullName, String email, StaffRole role, boolean active, Instant createdAt) {}
