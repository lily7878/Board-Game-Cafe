package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.Size;

public record UpdateGameCategoryRequest(@Size(max = 100) String name, String description) {
}
