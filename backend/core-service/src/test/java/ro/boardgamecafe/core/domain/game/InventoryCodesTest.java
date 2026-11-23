package ro.boardgamecafe.core.domain.game;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class InventoryCodesTest {

    @Test
    void defaultPrefix_usesFirstLettersWithoutDiacritics() {
        assertThat(InventoryCodes.defaultPrefix("Catan")).isEqualTo("CAT");
        assertThat(InventoryCodes.defaultPrefix("Țara lui Ștefan")).isEqualTo("TAR");
        assertThat(InventoryCodes.defaultPrefix("7 Wonders")).isEqualTo("7WO");
        assertThat(InventoryCodes.defaultPrefix("Go")).isEqualTo("GO");
        assertThat(InventoryCodes.defaultPrefix("¿?")).isEqualTo(InventoryCodes.FALLBACK_PREFIX);
    }

    @Test
    void next_continuesAfterHighestNumberOfTheSamePrefix() {
        List<String> existing = List.of("CAT-01", "CAT-03", "cat-02", "CATAN-99", "CAT-X", "DIX-07");

        assertThat(InventoryCodes.next("CAT", existing, 3)).containsExactly("CAT-04", "CAT-05", "CAT-06");
    }

    @Test
    void next_startsAtOneAndGrowsBeyondTwoDigits() {
        assertThat(InventoryCodes.next("AZU", List.of(), 2)).containsExactly("AZU-01", "AZU-02");
        assertThat(InventoryCodes.next("AZU", List.of("AZU-99"), 2)).containsExactly("AZU-100", "AZU-101");
    }

    @Test
    void rejectsInvalidPrefixOrCount() {
        assertThatThrownBy(() -> InventoryCodes.next("CA T", List.of(), 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> InventoryCodes.next("CAT", List.of(), 0)).isInstanceOf(IllegalArgumentException.class);
    }
}
