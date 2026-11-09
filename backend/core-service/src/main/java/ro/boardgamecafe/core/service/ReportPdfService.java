package ro.boardgamecafe.core.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import ro.boardgamecafe.core.api.report.dto.ReportResponses;
import ro.boardgamecafe.core.domain.report.DayFigures;

/**
 * Renders a finalized daily report as PDF, on request, from the stored snapshot (no PDF files are kept).
 * Liberation Sans is embedded so Romanian diacritics in product and game names are displayed correctly.
 */
@Service
public class ReportPdfService {
    private static final ZoneId ZONE = ZoneId.of("Europe/Bucharest");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZONE);
    private static final Color ACCENT = new Color(0x92, 0x5E, 0x68);   // deep-rose from the FE design tokens
    private static final Color HEADER_BG = new Color(0xEA, 0xD6, 0xD8); // blush

    private final CafeSettingsService settingsService;
    private final BaseFont regular;
    private final BaseFont bold;

    public ReportPdfService(CafeSettingsService settingsService) {
        this.settingsService = settingsService;
        this.regular = loadFont("liberation/LiberationSans-Regular.ttf");
        this.bold = loadFont("liberation/LiberationSans-Bold.ttf");
    }

    public byte[] render(ReportResponses.DailyReport report) {
        DayFigures figures = report.figures();
        Font title = new Font(bold, 18, Font.NORMAL, ACCENT);
        Font heading = new Font(bold, 12, Font.NORMAL, ACCENT);
        Font text = new Font(regular, 10);
        Font muted = new Font(regular, 9, Font.NORMAL, Color.DARK_GRAY);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 48, 48, 48, 48);
        PdfWriter.getInstance(document, out);
        document.addTitle("Raport " + report.label());
        document.open();

        document.add(new Paragraph(settingsService.current().getCafeName(), muted));
        document.add(new Paragraph("Raport zilnic — " + report.label(), title));
        document.add(new Paragraph("Zi deschisă: %s   •   Finalizată: %s%s".formatted(format(report.openedAt()),
                format(report.finalizedAt()), report.finalizedBy() == null ? "" : " de " + report.finalizedBy()), muted));
        document.add(new Paragraph("Generat: " + format(Instant.now()), muted));

        document.add(section("Rezumat", heading));
        PdfPTable summary = table(new float[] { 3, 2 });
        row(summary, text, "Venit total", money(figures.totalRevenue()));
        row(summary, text, "Venit meniu", money(figures.menuRevenue()));
        row(summary, text, "Venit tarife acces", money(figures.accessFeeRevenue()));
        row(summary, text, "Sesiuni închise", String.valueOf(figures.closedSessions()));
        row(summary, text, "Comenzi livrate", String.valueOf(figures.deliveredOrders()));
        row(summary, text, "Produse vândute", String.valueOf(figures.productsSold()));
        row(summary, text, "Jocuri livrate", String.valueOf(figures.gamesDelivered()));
        document.add(summary);

        document.add(section("Produse", heading));
        if (figures.products().isEmpty()) document.add(new Paragraph("Nu s-au vândut produse.", text));
        else {
            PdfPTable products = table(new float[] { 4, 1.3f, 2 });
            header(products, "Produs", "Cantitate", "Venit");
            figures.products().forEach(p -> row(products, text, p.name(), String.valueOf(p.quantity()), money(p.revenue())));
            document.add(products);
        }

        document.add(section("Jocuri", heading));
        if (figures.games().isEmpty()) document.add(new Paragraph("Nu au existat cereri de jocuri.", text));
        else {
            PdfPTable games = table(new float[] { 4, 1.3f, 1.3f });
            header(games, "Joc", "Cereri", "Livrări");
            figures.games().forEach(g -> row(games, text, g.title(), String.valueOf(g.requested()), String.valueOf(g.delivered())));
            document.add(games);
        }

        document.close();
        return out.toByteArray();
    }

    private Paragraph section(String name, Font font) {
        Paragraph paragraph = new Paragraph(name, font);
        paragraph.setSpacingBefore(16);
        paragraph.setSpacingAfter(6);
        return paragraph;
    }

    private static PdfPTable table(float[] widths) {
        PdfPTable table = new PdfPTable(widths);
        table.setWidthPercentage(100);
        return table;
    }

    private void header(PdfPTable table, String... names) {
        Font font = new Font(bold, 10);
        for (int i = 0; i < names.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(names[i], font));
            cell.setBackgroundColor(HEADER_BG);
            cell.setPadding(5);
            if (i > 0) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cell);
        }
    }

    private static void row(PdfPTable table, Font font, String... values) {
        for (int i = 0; i < values.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(values[i], font));
            cell.setPadding(5);
            if (i > 0) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cell);
        }
    }

    private static String money(BigDecimal value) {
        return "%.2f lei".formatted(value);
    }

    private static String format(Instant instant) {
        return instant == null ? "-" : DATE_TIME.format(instant);
    }

    private static BaseFont loadFont(String resource) {
        try (InputStream stream = ReportPdfService.class.getClassLoader().getResourceAsStream(resource)) {
            if (stream == null) throw new IllegalStateException("Font not found on classpath: " + resource);
            return BaseFont.createFont(resource, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, stream.readAllBytes(), null);
        } catch (IOException ex) {
            throw new UncheckedIOException("Cannot load font " + resource, ex);
        }
    }
}
