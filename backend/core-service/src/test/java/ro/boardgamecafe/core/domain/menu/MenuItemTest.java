package ro.boardgamecafe.core.domain.menu;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class MenuItemTest {
    private final MenuCategory drinks = new MenuCategory("Băuturi calde", null, 1);

    @Test
    void defaultsToCoffeeIcon_andCleansTags() {
        MenuItem item = new MenuItem(drinks, "Latte", null, new BigDecimal("18.00"), null,
                List.of(" Conține lactoză ", "Cofeină", "Cofeină", ""));

        assertThat(item.getIcon()).isEqualTo(MenuItem.DEFAULT_ICON);
        assertThat(item.getTags()).containsExactly("Conține lactoză", "Cofeină");
    }

    @Test
    void priceMustBePositive() {
        assertThatThrownBy(() -> new MenuItem(drinks, "Gratis", null, BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsInvalidIconsAndTags() {
        MenuItem item = new MenuItem(drinks, "Latte", null, BigDecimal.TEN);
        assertThatThrownBy(() -> item.changeIcon("Cup Soda")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item.changeTags(List.of("a", "b", "c", "d", "e", "f")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item.changeTags(List.of("lapte|zahăr"))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void tagConverterRoundTrip() {
        TagListConverter converter = new TagListConverter();
        String column = converter.convertToDatabaseColumn(List.of("Conține lactoză", "Cofeină"));
        assertThat(converter.convertToEntityAttribute(column)).containsExactly("Conține lactoză", "Cofeină");
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
    }
}
