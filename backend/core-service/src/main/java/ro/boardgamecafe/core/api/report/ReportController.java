package ro.boardgamecafe.core.api.report;

import java.security.Principal;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.report.dto.ReportResponses;
import ro.boardgamecafe.core.service.EndOfDayService;
import ro.boardgamecafe.core.service.ReportPdfService;
import ro.boardgamecafe.core.service.ReportService;

/** Manager-only: End of Day, day history, reports, comparison and PDF export. */
@RestController
public class ReportController {
    private final EndOfDayService endOfDayService;
    private final ReportService reportService;
    private final ReportPdfService pdfService;

    public ReportController(EndOfDayService endOfDayService, ReportService reportService, ReportPdfService pdfService) {
        this.endOfDayService = endOfDayService;
        this.reportService = reportService;
        this.pdfService = pdfService;
    }

    /** 201 when the day is finalized now, 200 when it had already been finalized (same report). */
    @PostMapping("/api/admin/business-days/{id}/finalize")
    public ResponseEntity<ReportResponses.DailyReport> finalizeDay(@PathVariable Long id, Principal principal) {
        EndOfDayService.Result result = endOfDayService.finalizeDay(id, principal.getName());
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.report());
    }

    @GetMapping("/api/admin/business-days")
    public List<ReportResponses.DaySummary> days() {
        return reportService.days();
    }

    @GetMapping("/api/admin/business-days/current/preview")
    public ReportResponses.CurrentDayPreview currentDay() {
        return reportService.currentDay();
    }

    @GetMapping("/api/admin/reports")
    public List<ReportResponses.DayTotals> reports() {
        return reportService.reports();
    }

    @GetMapping("/api/admin/reports/{businessDayId}")
    public ReportResponses.DailyReport report(@PathVariable Long businessDayId) {
        return reportService.report(businessDayId);
    }

    @GetMapping("/api/admin/reports/{businessDayId}/pdf")
    public ResponseEntity<byte[]> reportPdf(@PathVariable Long businessDayId) {
        ReportResponses.DailyReport report = reportService.report(businessDayId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("raport-ziua-" + report.dayNumber() + ".pdf").build().toString())
                .body(pdfService.render(report));
    }

    @GetMapping("/api/admin/analytics/days/compare")
    public ReportResponses.DayComparison compare(@RequestParam int fromDay, @RequestParam int toDay) {
        return reportService.compare(fromDay, toDay);
    }
}
