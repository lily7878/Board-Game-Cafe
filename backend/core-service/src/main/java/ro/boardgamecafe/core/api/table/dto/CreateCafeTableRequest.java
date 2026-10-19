package ro.boardgamecafe.core.api.table.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;


public record CreateCafeTableRequest(
    @NotNull @Positive Integer tableNumber, 
    @NotNull @Positive Integer capacity) {

    
}
