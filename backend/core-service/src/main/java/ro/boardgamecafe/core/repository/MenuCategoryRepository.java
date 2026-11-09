package ro.boardgamecafe.core.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.menu.MenuCategory;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<MenuCategory> findAllByOrderByNameAsc();
}
