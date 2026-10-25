package ro.boardgamecafe.core.api.table.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeCafeTableStatusRequest(
    @NotNull Boolean active
) {

}
