package ro.boardgamecafe.core.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.boardgamecafe.core.domain.menu.MenuItem;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    @Query("select item from MenuItem item join fetch item.category order by item.category.name, item.name")
    List<MenuItem> findAllWithCategory();

    @Query("select item from MenuItem item join fetch item.category where item.category.id = :categoryId order by item.name")
    List<MenuItem> findByCategoryWithCategory(@Param("categoryId") Long categoryId);

    /** Products a participant can order: active, available and in an active category. */
    @Query("""
            select item from MenuItem item join fetch item.category category
            where item.active = true and item.available = true and category.active = true
            order by category.name, item.name""")
    List<MenuItem> findOrderable();

    @Query("select item from MenuItem item join fetch item.category where item.id in :ids")
    List<MenuItem> findAllByIdWithCategory(@Param("ids") Collection<Long> ids);
}
