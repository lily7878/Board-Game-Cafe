package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.game.GameCategory;
import java.util.List;


public interface GameCategoryRepository extends JpaRepository<GameCategory, Long> {
    List<GameCategory> findByActiveTrueOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
