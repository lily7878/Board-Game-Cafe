package ro.boardgamecafe.core.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.report.dto.ReportResponses;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.domain.report.DailyReport;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.BusinessDayRepository;
import ro.boardgamecafe.core.repository.DailyReportRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/** Read side of the business days: history, live preview, final reports and day comparison. */
@Service
@Transactional(readOnly = true)
public class ReportService {
    private static final int MAX_COMPARED_DAYS = 60;
    private static final int TOP_LIMIT = 5;

    private final BusinessDayRepository dayRepository;
    private final DailyReportRepository reportRepository;
    private final TableSessionRepository sessionRepository;
    private final DayFiguresCalculator calculator;

    public ReportService(BusinessDayRepository dayRepository, DailyReportRepository reportRepository,
            TableSessionRepository sessionRepository, DayFiguresCalculator calculator) {
        this.dayRepository = dayRepository;
        this.reportRepository = reportRepository;
        this.sessionRepository = sessionRepository;
        this.calculator = calculator;
    }

    public List<ReportResponses.DaySummary> days() {
        Map<Long, DailyReport> reports = reportRepository.findAllNewestFirst().stream()
                .collect(Collectors.toMap(report -> report.getBusinessDay().getId(), Function.identity()));
        return dayRepository.findAllByOrderByDayNumberDesc().stream().map(day -> {
            DailyReport report = reports.get(day.getId());
            return new ReportResponses.DaySummary(day.getId(), day.getDayNumber(), day.getLabel(), day.getStatus(),
                    day.getOpenedAt(), day.getFinalizedAt(), report == null ? null : report.getTotalRevenue());
        }).toList();
    }

    public ReportResponses.CurrentDayPreview currentDay() {
        BusinessDay day = dayRepository.findOpen()
                .orElseThrow(() -> new ConflictException("No business day is currently open."));
        long openSessions = sessionRepository.countByStatusNot(SessionStatus.CLOSED);
        return new ReportResponses.CurrentDayPreview(day.getId(), day.getDayNumber(), day.getLabel(),
                day.getOpenedAt(), openSessions, openSessions == 0, calculator.compute(day.getId()));
    }

    public ReportResponses.DailyReport report(Long businessDayId) {
        return response(findReport(businessDayId));
    }

    public DailyReport findReport(Long businessDayId) {
        return reportRepository.findByBusinessDayId(businessDayId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No final report for business day " + businessDayId + "; it may still be open."));
    }

    public List<ReportResponses.DayTotals> reports() {
        return reportRepository.findAllNewestFirst().stream().map(ReportService::totals).toList();
    }

    /** Compares finalized days by day number (inclusive), with the best products and games of the range. */
    public ReportResponses.DayComparison compare(int fromDay, int toDay) {
        if (fromDay < 1 || toDay < fromDay)
            throw new IllegalArgumentException("Use 1 <= fromDay <= toDay.");
        if (toDay - fromDay + 1 > MAX_COMPARED_DAYS)
            throw new IllegalArgumentException("At most " + MAX_COMPARED_DAYS + " days can be compared at once.");
        PageRequest top = PageRequest.of(0, TOP_LIMIT);
        return new ReportResponses.DayComparison(fromDay, toDay,
                reportRepository.findForDayRange(fromDay, toDay).stream().map(ReportService::totals).toList(),
                reportRepository.topProducts(fromDay, toDay, top), reportRepository.topGames(fromDay, toDay, top));
    }

    static ReportResponses.DailyReport response(DailyReport report) {
        BusinessDay day = report.getBusinessDay();
        return new ReportResponses.DailyReport(day.getId(), day.getDayNumber(), day.getLabel(), day.getOpenedAt(),
                day.getFinalizedAt(), day.getFinalizedBy() == null ? null : day.getFinalizedBy().getFullName(),
                report.getGeneratedAt(), report.toFigures());
    }

    private static ReportResponses.DayTotals totals(DailyReport report) {
        BusinessDay day = report.getBusinessDay();
        return new ReportResponses.DayTotals(day.getId(), day.getDayNumber(), day.getLabel(), report.getTotalRevenue(),
                report.getMenuRevenue(), report.getAccessFeeRevenue(), report.getClosedSessionsCount(),
                report.getDeliveredOrdersCount(), report.getProductsSoldCount(), report.getGamesDeliveredCount());
    }
}
