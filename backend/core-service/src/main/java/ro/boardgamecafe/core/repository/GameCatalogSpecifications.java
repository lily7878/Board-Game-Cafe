package ro.boardgamecafe.core.repository;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import ro.boardgamecafe.core.api.game.dto.GameCatalogCriteria;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.game.GameCategory;
import ro.boardgamecafe.core.domain.game.GameCopy;
import ro.boardgamecafe.core.domain.game.GameRequest;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;

public final class GameCatalogSpecifications {
    private GameCatalogSpecifications() {}

    public static Specification<Game> matching(GameCatalogCriteria criteria) {
        return (game, query, builder) -> {
            List<Predicate> filters = new ArrayList<>();
            filters.add(builder.isTrue(game.get("active")));

            if (criteria.categoryId() != null) {
                Subquery<Long> categoryQuery = query.subquery(Long.class);
                Root<Game> correlatedGame = categoryQuery.correlate(game);
                Join<Game, GameCategory> category = correlatedGame.join("categories");
                categoryQuery.select(category.get("id")).where(
                        builder.equal(category.get("id"), criteria.categoryId()),
                        builder.isTrue(category.get("active")));
                filters.add(builder.exists(categoryQuery));
            }
            if (criteria.players() != null) {
                filters.add(builder.lessThanOrEqualTo(game.get("minPlayers"), criteria.players()));
                filters.add(builder.greaterThanOrEqualTo(game.get("maxPlayers"), criteria.players()));
            }
            if (criteria.maxDurationMinutes() != null) {
                filters.add(builder.lessThanOrEqualTo(game.get("durationMinutes"), criteria.maxDurationMinutes()));
            }
            if (criteria.age() != null) {
                filters.add(builder.lessThanOrEqualTo(game.get("minimumAge"), criteria.age()));
            }
            if (criteria.difficulty() != null) {
                filters.add(builder.equal(game.get("difficulty"), criteria.difficulty()));
            }
            if (criteria.availableOnly()) {
                Subquery<Long> copyQuery = query.subquery(Long.class);
                Root<GameCopy> copy = copyQuery.from(GameCopy.class);
                Subquery<Long> occupiedQuery = copyQuery.subquery(Long.class);
                Root<GameCopy> correlatedCopy = occupiedQuery.correlate(copy);
                Root<GameRequest> request = occupiedQuery.from(GameRequest.class);
                occupiedQuery.select(request.get("id")).where(
                        builder.equal(request.get("gameCopy"), correlatedCopy),
                        request.get("status").in(GameRequestStatus.RESERVED, GameRequestStatus.DELIVERED));
                copyQuery.select(copy.get("id")).where(
                        builder.equal(copy.get("game"), game),
                        builder.equal(copy.get("conditionStatus"), CopyCondition.USABLE),
                        builder.not(builder.exists(occupiedQuery)));
                filters.add(builder.exists(copyQuery));
            }
            return builder.and(filters.toArray(Predicate[]::new));
        };
    }
}
