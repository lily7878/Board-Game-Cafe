package ro.boardgamecafe.core.domain.menu;

import java.util.Arrays;
import java.util.List;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores a short list of product tags in one column, separated by '|'. */
@Converter
public class TagListConverter implements AttributeConverter<List<String>, String> {
    static final String SEPARATOR = "|";

    @Override
    public String convertToDatabaseColumn(List<String> tags) {
        return tags == null ? "" : String.join(SEPARATOR, tags);
    }

    @Override
    public List<String> convertToEntityAttribute(String column) {
        if (column == null || column.isBlank()) return List.of();
        return Arrays.stream(column.split("\\|")).filter(tag -> !tag.isBlank()).toList();
    }
}
