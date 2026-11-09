package ro.boardgamecafe.core.service;

import ro.boardgamecafe.core.live.LiveEvents;

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
    private final LiveEvents events;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final SessionAccessService accessService;

    public MenuService(MenuCategoryRepository categoryRepository, MenuItemRepository itemRepository,
            SessionAccessService accessService, LiveEvents events) {
        this.events = events;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.accessService = accessService;
    }

    // ---- categories ----

    @Transactional
    public MenuResponses.Category createCategory(MenuCategoryRequests.Create request) {
        events.catalog("menu.changed", null);
        ensureUniqueCategoryName(request.name(), null);
        int position = categoryRepository.maxSortOrder() + 1;
        return response(categoryRepository.save(new MenuCategory(request.name(), request.description(), position)), 0);
    }

    public List<MenuResponses.Category> categories() {
        Map<Long, Long> counts = productCounts();
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(category -> response(category, counts.getOrDefault(category.getId(), 0L))).toList();
    }

    public MenuResponses.Category category(Long id) {
        return response(findCategory(id), productCounts().getOrDefault(id, 0L));
    }

    /** Applies a new order; the list must contain every category exactly once. */
    @Transactional
    public List<MenuResponses.Category> reorderCategories(List<Long> categoryIds) {
        events.catalog("menu.changed", null);
        List<MenuCategory> all = categoryRepository.findAll();
        java.util.Set<Long> requested = new java.util.HashSet<>(categoryIds);
        if (requested.size() != categoryIds.size() || requested.size() != all.size()
                || !all.stream().allMatch(category -> requested.contains(category.getId())))
            throw new IllegalArgumentException("The new order must list every menu category exactly once.");
        Map<Long, MenuCategory> byId = all.stream().collect(java.util.stream.Collectors.toMap(MenuCategory::getId, c -> c));
        for (int i = 0; i < categoryIds.size(); i++) byId.get(categoryIds.get(i)).moveToPosition(i + 1);
        categoryRepository.flush();
        return categories();
    }

    @Transactional
    public MenuResponses.Category updateCategory(Long id, MenuCategoryRequests.Update request) {
        events.catalog("menu.changed", null);
        MenuCategory category = findCategory(id);
        if (request.name() != null) {
            ensureUniqueCategoryName(request.name(), id);
            category.rename(request.name());
        }
        if (request.description() != null) category.describe(request.description());
        return response(category, productCounts().getOrDefault(id, 0L));
    }

    @Transactional
    public MenuResponses.Category setCategoryActive(Long id, boolean active) {
        events.catalog("menu.changed", null);
        MenuCategory category = findCategory(id);
        category.setActive(active);
        return response(category, productCounts().getOrDefault(id, 0L));
    }

    // ---- products ----

    @Transactional
    public MenuResponses.Item createItem(MenuItemRequests.Create request) {
        events.catalog("menu.changed", null);
        MenuCategory category = findCategory(request.categoryId());
        return response(itemRepository.save(new MenuItem(category, request.name(), request.description(),
                request.price(), request.icon(), request.tags())));
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
        events.catalog("menu.changed", null);
        MenuItem item = findItem(id);
        if (request.categoryId() != null) item.moveTo(findCategory(request.categoryId()));
        if (request.name() != null) item.rename(request.name());
        if (request.description() != null) item.describe(request.description());
        if (request.price() != null) item.changePrice(request.price());
        if (request.icon() != null) item.changeIcon(request.icon());
        if (request.tags() != null) item.changeTags(request.tags());
        return response(item);
    }

    @Transactional
    public MenuResponses.Item setItemActive(Long id, boolean active) {
        events.catalog("menu.changed", null);
        MenuItem item = findItem(id);
        item.setActive(active);
        return response(item);
    }

    @Transactional
    public MenuResponses.Item setItemAvailable(Long id, boolean available) {
        events.catalog("menu.changed", null);
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
                            item.getPrice(), item.getIcon(), item.getTags()));
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

    private Map<Long, Long> productCounts() {
        Map<Long, Long> counts = new java.util.HashMap<>();
        for (Object[] row : categoryRepository.countProductsByCategory()) counts.put((Long) row[0], (Long) row[1]);
        return counts;
    }

    private static MenuResponses.Category response(MenuCategory category, long productCount) {
        return new MenuResponses.Category(category.getId(), category.getName(), category.getDescription(),
                category.isActive(), category.getSortOrder(), productCount);
    }

    private static MenuResponses.Item response(MenuItem item) {
        return new MenuResponses.Item(item.getId(), item.getCategory().getId(), item.getCategory().getName(),
                item.getName(), item.getDescription(), item.getPrice(), item.isAvailable(), item.isActive(),
                item.isOrderable(), item.getCreatedAt(), item.getIcon(), item.getTags());
    }
}
