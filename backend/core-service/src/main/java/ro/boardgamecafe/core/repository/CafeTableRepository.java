package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import ro.boardgamecafe.core.domain.table.CafeTable;

public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    // Additional query methods can be defined here if needed
    boolean existsByTableNumber(Integer tableNumber);
    boolean existsByTableNumberAndIdNot(Integer tableNumber, Long id);
}
