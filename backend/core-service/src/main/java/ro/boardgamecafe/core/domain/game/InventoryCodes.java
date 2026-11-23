package ro.boardgamecafe.core.domain.game;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generates inventory codes such as CAT-01, CAT-02 when several copies are added at once.
 * Numbering continues after the highest existing code with the same prefix, so codes stay unique and readable.
 */
public final class InventoryCodes {
    public static final String FALLBACK_PREFIX = "JOC";
    private static final Pattern VALID_PREFIX = Pattern.compile("^[A-Z0-9]{1,10}$");

    private InventoryCodes() {
    }

    /** First three letters/digits of the title, without diacritics, upper case ("Țara lui Ștefan" → "TAR"). */
    public static String defaultPrefix(String title) {
        String ascii = Normalizer.normalize(title == null ? "" : title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        return ascii.isEmpty() ? FALLBACK_PREFIX : ascii.substring(0, Math.min(3, ascii.length()));
    }

    public static boolean isValidPrefix(String prefix) {
        return prefix != null && VALID_PREFIX.matcher(prefix).matches();
    }

    /**
     * @param existingCodes codes already in use that start with the prefix (others are ignored)
     * @return count new codes PREFIX-NN, numbered after the highest PREFIX-number found
     */
    public static List<String> next(String prefix, Collection<String> existingCodes, int count) {
        if (!isValidPrefix(prefix)) throw new IllegalArgumentException("The code prefix must have 1-10 letters or digits.");
        if (count < 1) throw new IllegalArgumentException("At least one copy must be added.");
        Pattern numbered = Pattern.compile("^" + Pattern.quote(prefix) + "-(\\d{1,9})$");
        int highest = 0;
        for (String code : existingCodes) {
            Matcher matcher = numbered.matcher(code == null ? "" : code.toUpperCase(Locale.ROOT));
            if (matcher.matches()) highest = Math.max(highest, Integer.parseInt(matcher.group(1)));
        }
        List<String> codes = new ArrayList<>(count);
        for (int i = 1; i <= count; i++) codes.add("%s-%02d".formatted(prefix, highest + i));
        return codes;
    }
}
