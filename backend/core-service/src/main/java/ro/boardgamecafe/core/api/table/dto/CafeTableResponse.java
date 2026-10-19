package ro.boardgamecafe.core.api.table.dto;

import java.time.Instant;

public record CafeTableResponse(Long id, Integer tableNumber, Integer capacity, Boolean active, Instant createdAt) {

}
