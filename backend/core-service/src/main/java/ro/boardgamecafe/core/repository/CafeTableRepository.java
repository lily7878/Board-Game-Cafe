package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import ro.boardgamecafe.core.domain.table.CafeTable;

public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select table from CafeTable table where table.id = :id")
    Optional<CafeTable> findByIdForUpdate(@Param("id") Long id);
    // Additional query methods can be defined here if needed
    boolean existsByTableNumber(Integer tableNumber);
    boolean existsByTableNumberAndIdNot(Integer tableNumber, Long id);
}
