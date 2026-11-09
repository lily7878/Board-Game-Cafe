package ro.boardgamecafe.core.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import ro.boardgamecafe.core.domain.day.BusinessDay;

public interface BusinessDayRepository extends JpaRepository<BusinessDay, Long> {
    @Query("select day from BusinessDay day where day.status = ro.boardgamecafe.core.domain.day.BusinessDayStatus.OPEN")
    Optional<BusinessDay> findOpen();

    /**
     * Locks the open day row. Opening a session and End of Day both take this lock, so a session can
     * never be attached to a day that is being finalized.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select day from BusinessDay day where day.status = ro.boardgamecafe.core.domain.day.BusinessDayStatus.OPEN")
    Optional<BusinessDay> findOpenForUpdate();
}
