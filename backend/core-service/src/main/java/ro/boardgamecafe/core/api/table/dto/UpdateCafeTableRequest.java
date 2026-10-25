package ro.boardgamecafe.core.api.table.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;

public record UpdateCafeTableRequest (
    @Positive Integer tableNumber,
    @Positive Integer capacity   
) {
    @AssertTrue(message = "At least one of tableNumber or capacity must be provided.")
    public boolean isUpdateRequestValid() {
        return tableNumber != null || capacity != null;
    }

}
