package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGameCategoryRequest(@NotBlank @Size(max = 100) String name, String description) {
}
