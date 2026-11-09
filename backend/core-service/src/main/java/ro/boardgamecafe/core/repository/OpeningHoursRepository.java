package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.settings.OpeningHours;

public interface OpeningHoursRepository extends JpaRepository<OpeningHours, Long> {
    List<OpeningHours> findAllByOrderByDayOfWeekAsc();
    Optional<OpeningHours> findByDayOfWeek(int dayOfWeek);
}
