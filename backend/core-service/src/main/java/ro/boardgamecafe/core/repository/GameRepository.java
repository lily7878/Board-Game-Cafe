package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import ro.boardgamecafe.core.domain.game.Game;

public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {
    Optional<Game> findByIdAndActiveTrue(Long id);

    @Query("select game.id, category.id from Game game join game.categories category "
            + "where game.id in :gameIds and category.active = true")
    List<Object[]> findActiveCategoryIdsByGameIds(@Param("gameIds") Set<Long> gameIds);
}
