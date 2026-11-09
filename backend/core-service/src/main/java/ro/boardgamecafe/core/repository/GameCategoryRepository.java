package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.game.GameCategory;
import java.util.List;


public interface GameCategoryRepository extends JpaRepository<GameCategory, Long> {
    List<GameCategory> findByActiveTrueOrderByNameAsc();

    /** Number of games linked to each category, as [categoryId, count]. */
    @org.springframework.data.jpa.repository.Query(
            "select category.id, count(game) from Game game join game.categories category group by category.id")
    List<Object[]> countGamesByCategory();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
