package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.boardgamecafe.core.domain.report.DailyReport;
import ro.boardgamecafe.core.domain.report.DayFigures;

public interface DailyReportRepository extends JpaRepository<DailyReport, Long> {
    @Query("select report from DailyReport report join fetch report.businessDay where report.businessDay.id = :dayId")
    Optional<DailyReport> findByBusinessDayId(@Param("dayId") Long dayId);

    @Query("select report from DailyReport report join fetch report.businessDay day order by day.dayNumber desc")
    List<DailyReport> findAllNewestFirst();

    @Query("""
            select report from DailyReport report join fetch report.businessDay day
            where day.dayNumber between :fromDay and :toDay order by day.dayNumber""")
    List<DailyReport> findForDayRange(@Param("fromDay") int fromDay, @Param("toDay") int toDay);

    /** Custom query: best-selling products over a range of finalized days, from the snapshots. */
    @Query("""
            select new ro.boardgamecafe.core.domain.report.DayFigures$ProductSales(
                stat.menuItem.id, max(stat.productNameSnapshot), sum(stat.quantitySold), sum(stat.revenue))
            from DailyProductStat stat
            where stat.report.businessDay.dayNumber between :fromDay and :toDay
            group by stat.menuItem.id
            order by sum(stat.quantitySold) desc, sum(stat.revenue) desc""")
    List<DayFigures.ProductSales> topProducts(@Param("fromDay") int fromDay, @Param("toDay") int toDay, Pageable page);

    /** Custom query: most played games (actual loans) over a range of finalized days. */
    @Query("""
            select new ro.boardgamecafe.core.domain.report.DayFigures$GameUsage(
                stat.game.id, max(stat.gameTitleSnapshot), sum(stat.timesRequested), sum(stat.timesDelivered))
            from DailyGameStat stat
            where stat.report.businessDay.dayNumber between :fromDay and :toDay
            group by stat.game.id
            order by sum(stat.timesDelivered) desc, sum(stat.timesRequested) desc""")
    List<DayFigures.GameUsage> topGames(@Param("fromDay") int fromDay, @Param("toDay") int toDay, Pageable page);
}
