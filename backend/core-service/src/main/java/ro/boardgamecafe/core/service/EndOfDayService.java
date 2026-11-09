package ro.boardgamecafe.core.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.report.dto.ReportResponses;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.domain.report.DailyReport;
import ro.boardgamecafe.core.domain.report.DayFigures;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.BusinessDayRepository;
import ro.boardgamecafe.core.repository.DailyReportRepository;
import ro.boardgamecafe.core.repository.GameRepository;
import ro.boardgamecafe.core.repository.MenuItemRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/**
 * T6 — End of Day. In one transaction and under the lock of the day row (the same lock taken when a
 * session is opened): checks that every session of the cafe is CLOSED, writes the final snapshot,
 * marks the day FINALIZED and opens the next day. Repeating the call returns the existing report.
 */
@Service
public class EndOfDayService {
    /** Outcome of a finalize call; created is false when the day had already been finalized. */
    public record Result(ReportResponses.DailyReport report, boolean created) {}

    private final BusinessDayService businessDayService;
    private final BusinessDayRepository dayRepository;
    private final DailyReportRepository reportRepository;
    private final TableSessionRepository sessionRepository;
    private final MenuItemRepository menuItemRepository;
    private final GameRepository gameRepository;
    private final StaffUserRepository staffRepository;
    private final DayFiguresCalculator calculator;

    public EndOfDayService(BusinessDayService businessDayService, BusinessDayRepository dayRepository,
            DailyReportRepository reportRepository, TableSessionRepository sessionRepository,
            MenuItemRepository menuItemRepository, GameRepository gameRepository, StaffUserRepository staffRepository,
            DayFiguresCalculator calculator) {
        this.businessDayService = businessDayService;
        this.dayRepository = dayRepository;
        this.reportRepository = reportRepository;
        this.sessionRepository = sessionRepository;
        this.menuItemRepository = menuItemRepository;
        this.gameRepository = gameRepository;
        this.staffRepository = staffRepository;
        this.calculator = calculator;
    }

    @Transactional
    public Result finalizeDay(Long dayId, String managerEmail) {
        BusinessDay day = businessDayService.lockById(dayId);
        if (!day.isOpen()) {
            DailyReport existing = reportRepository.findByBusinessDayId(dayId)
                    .orElseThrow(() -> new IllegalStateException("Finalized day without report: " + dayId));
            return new Result(ReportService.response(existing), false);
        }
        long openSessions = sessionRepository.countByStatusNot(SessionStatus.CLOSED);
        if (openSessions > 0)
            throw new ConflictException("End of Day requires every session to be closed; %d still open."
                    .formatted(openSessions));

        DayFigures figures = calculator.compute(day.getId());
        StaffUser manager = staffRepository.findByEmailIgnoreCase(managerEmail)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
        day.finalizeDay(manager);
        // The finalization must reach the database before the next OPEN day is inserted:
        // the partial unique index allows only one OPEN day at any moment.
        dayRepository.flush();
        DailyReport report = reportRepository.save(new DailyReport(day, figures,
                menuItemRepository::getReferenceById, gameRepository::getReferenceById));
        dayRepository.save(day.next());
        dayRepository.flush();
        return new Result(ReportService.response(report), true);
    }
}
