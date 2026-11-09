package ro.boardgamecafe.core.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import ro.boardgamecafe.core.api.report.dto.ReportResponses;
import ro.boardgamecafe.core.domain.report.DayFigures;
import ro.boardgamecafe.core.domain.settings.CafeSettings;

class ReportPdfServiceTest {

    @Test
    void rendersReadablePdf_withRomanianDiacritics() throws Exception {
        CafeSettings settings = Mockito.mock(CafeSettings.class);
        Mockito.when(settings.getCafeName()).thenReturn("Board Game Café");
        CafeSettingsService settingsService = Mockito.mock(CafeSettingsService.class);
        Mockito.when(settingsService.current()).thenReturn(settings);

        DayFigures figures = new DayFigures(new BigDecimal("57.00"), new BigDecimal("37.00"), new BigDecimal("20.00"),
                2, 3, 4, 1,
                List.of(new DayFigures.ProductSales(1L, "Prăjitură cu brânză", 2L, new BigDecimal("30.00"))),
                List.of(new DayFigures.GameUsage(1L, "Țara lui Ștefan", 2L, 1L)));
        ReportResponses.DailyReport report = new ReportResponses.DailyReport(1L, 1, "Ziua 1", Instant.now(),
                Instant.now(), "Manager Test", Instant.now(), figures);

        byte[] pdf = new ReportPdfService(settingsService).render(report);

        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
        PdfReader reader = new PdfReader(pdf);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);
        reader.close();
        assertThat(text).contains("Raport zilnic", "Ziua 1", "57.00 lei", "Prăjitură cu brânză", "Țara lui Ștefan");
    }
}
