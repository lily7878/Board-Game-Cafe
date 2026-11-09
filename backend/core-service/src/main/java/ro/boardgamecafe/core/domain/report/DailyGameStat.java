package ro.boardgamecafe.core.domain.report;

import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.game.Game;

/** Requests and actual loans of one game title in one finalized day. */
@Entity
@Table(name = "daily_game_stats")
public class DailyGameStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private DailyReport report;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;
    @Column(name = "game_title_snapshot", nullable = false, length = 150)
    private String gameTitleSnapshot;
    @Column(name = "times_requested", nullable = false)
    private int timesRequested;
    @Column(name = "times_delivered", nullable = false)
    private int timesDelivered;

    protected DailyGameStat() {
    }

    DailyGameStat(DailyReport report, Game game, DayFigures.GameUsage usage) {
        this.report = report;
        this.game = game;
        this.gameTitleSnapshot = usage.title();
        this.timesRequested = Math.toIntExact(usage.requested());
        this.timesDelivered = Math.toIntExact(usage.delivered());
    }

    DayFigures.GameUsage toUsage() {
        return new DayFigures.GameUsage(game.getId(), gameTitleSnapshot, (long) timesRequested, (long) timesDelivered);
    }

    public Long getId() { return id; }
    public String getGameTitleSnapshot() { return gameTitleSnapshot; }
    public int getTimesRequested() { return timesRequested; }
    public int getTimesDelivered() { return timesDelivered; }
}
