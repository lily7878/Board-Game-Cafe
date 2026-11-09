package ro.boardgamecafe.core.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.menu.dto.MenuCategoryRequests;
import ro.boardgamecafe.core.api.menu.dto.MenuItemRequests;
import ro.boardgamecafe.core.api.menu.dto.MenuResponses;
import ro.boardgamecafe.core.domain.menu.MenuCategory;
import ro.boardgamecafe.core.domain.menu.MenuItem;
import ro.boardgamecafe.core.repository.MenuCategoryRepository;
import ro.boardgamecafe.core.repository.MenuItemRepository;

/** Manager administration of the menu and the participant-facing menu. Nothing is physically deleted. */
@Service
@Transactional(readOnly = true)
public class MenuService {
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final SessionAccessService accessService;

    public MenuService(MenuCategoryRepository categoryRepository, MenuItemRepository itemRepository,
            SessionAccessService accessService) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.accessService = accessService;
    }

    // ---- categories ----

    @Transactional
    public MenuResponses.Category createCategory(MenuCategoryRequests.Create request) {
        ensureUniqueCategoryName(request.name(), null);
        return response(categoryRepository.save(new MenuCategory(request.name(), request.description())));
    }

    public List<MenuResponses.Category> categories() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(MenuService::response).toList();
    }

    public MenuResponses.Category category(Long id) {
        return response(findCategory(id));
    }

    @Transactional
    public MenuResponses.Category updateCategory(Long id, MenuCategoryRequests.Update request) {
        MenuCategory category = findCategory(id);
        if (request.name() != null) {
            ensureUniqueCategoryName(request.name(), id);
            category.rename(request.name());
        }
        if (request.description() != null) category.describe(request.description());
        return response(category);
    }

    @Transactional
    public MenuResponses.Category setCategoryActive(Long id, boolean active) {
        MenuCategory category = findCategory(id);
        category.setActive(active);
        return response(category);
    }

    // ---- products ----

    @Transactional
    public MenuResponses.Item createItem(MenuItemRequests.Create request) {
        MenuCategory category = findCategory(request.categoryId());
        return response(itemRepository.save(
                new MenuItem(category, request.name(), request.description(), request.price())));
    }

    public List<MenuResponses.Item> items(Long categoryId) {
        List<MenuItem> items = categoryId == null ? itemRepository.findAllWithCategory()
                : itemRepository.findByCategoryWithCategory(categoryId);
        return items.stream().map(MenuService::response).toList();
    }

    public MenuResponses.Item item(Long id) {
        return response(findItem(id));
    }

    @Transactional
    public MenuResponses.Item updateItem(Long id, MenuItemRequests.Update request) {
        MenuItem item = findItem(id);
        if (request.categoryId() != null) item.moveTo(findCategory(request.categoryId()));
        if (request.name() != null) item.rename(request.name());
        if (request.description() != null) item.describe(request.description());
        if (request.price() != null) item.changePrice(request.price());
        return response(item);
    }

    @Transactional
    public MenuResponses.Item setItemActive(Long id, boolean active) {
        MenuItem item = findItem(id);
        item.setActive(active);
        return response(item);
    }

    @Transactional
    public MenuResponses.Item setItemAvailable(Long id, boolean available) {
        MenuItem item = findItem(id);
        item.setAvailable(available);
        return response(item);
    }

    // ---- participant menu ----

    public List<MenuResponses.PublicCategory> participantMenu(String accessToken) {
        accessService.authenticate(accessToken);
        Map<MenuCategory, List<MenuResponses.PublicItem>> grouped = new LinkedHashMap<>();
        for (MenuItem item : itemRepository.findOrderable()) {
            grouped.computeIfAbsent(item.getCategory(), key -> new java.util.ArrayList<>())
                    .add(new MenuResponses.PublicItem(item.getId(), item.getName(), item.getDescription(),
                            item.getPrice()));
        }
        return grouped.entrySet().stream()
                .map(entry -> new MenuResponses.PublicCategory(entry.getKey().getId(), entry.getKey().getName(),
                        entry.getKey().getDescription(), entry.getValue()))
                .toList();
    }

    private void ensureUniqueCategoryName(String name, Long id) {
        String trimmed = name.strip();
        boolean duplicate = id == null ? categoryRepository.existsByNameIgnoreCase(trimmed)
                : categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmed, id);
        if (duplicate) throw new DuplicateKeyException("A menu category with this name already exists.");
    }

    private MenuCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Menu category not found with id: " + id));
    }

    private MenuItem findItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Menu item not found with id: " + id));
    }

    private static MenuResponses.Category response(MenuCategory category) {
        return new MenuResponses.Category(category.getId(), category.getName(), category.getDescription(),
                category.isActive());
    }

    private static MenuResponses.Item response(MenuItem item) {
        return new MenuResponses.Item(item.getId(), item.getCategory().getId(), item.getCategory().getName(),
                item.getName(), item.getDescription(), item.getPrice(), item.isAvailable(), item.isActive(),
                item.isOrderable(), item.getCreatedAt());
    }
}
