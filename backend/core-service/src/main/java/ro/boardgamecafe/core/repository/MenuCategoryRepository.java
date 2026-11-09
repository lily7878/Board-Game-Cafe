package ro.boardgamecafe.core.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ro.boardgamecafe.core.domain.menu.MenuCategory;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<MenuCategory> findAllByOrderBySortOrderAscNameAsc();

    @Query("select coalesce(max(category.sortOrder), 0) from MenuCategory category")
    int maxSortOrder();

    /** Number of products (active or not) per category, as [categoryId, count]. */
    @Query("select item.category.id, count(item) from MenuItem item group by item.category.id")
    List<Object[]> countProductsByCategory();
}
