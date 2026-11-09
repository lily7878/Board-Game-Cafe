package ro.boardgamecafe.core.api.menu;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.menu.dto.MenuCategoryRequests;
import ro.boardgamecafe.core.api.menu.dto.MenuItemRequests;
import ro.boardgamecafe.core.api.menu.dto.MenuResponses;
import ro.boardgamecafe.core.service.MenuService;

@RestController
public class MenuController {
    private final MenuService service;

    public MenuController(MenuService service) {
        this.service = service;
    }

    // ---- manager: categories ----

    @PostMapping("/api/admin/menu-categories")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuResponses.Category createCategory(@Valid @RequestBody MenuCategoryRequests.Create request) {
        return service.createCategory(request);
    }

    @GetMapping("/api/admin/menu-categories")
    public List<MenuResponses.Category> categories() {
        return service.categories();
    }

    @GetMapping("/api/admin/menu-categories/{id}")
    public MenuResponses.Category category(@PathVariable Long id) {
        return service.category(id);
    }

    @PatchMapping("/api/admin/menu-categories/{id}")
    public MenuResponses.Category updateCategory(@PathVariable Long id,
            @Valid @RequestBody MenuCategoryRequests.Update request) {
        return service.updateCategory(id, request);
    }

    @PatchMapping("/api/admin/menu-categories/{id}/status")
    public MenuResponses.Category categoryStatus(@PathVariable Long id,
            @Valid @RequestBody MenuCategoryRequests.ChangeActive request) {
        return service.setCategoryActive(id, request.active());
    }

    // ---- manager: products ----

    @PostMapping("/api/admin/menu-items")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuResponses.Item createItem(@Valid @RequestBody MenuItemRequests.Create request) {
        return service.createItem(request);
    }

    @GetMapping("/api/admin/menu-items")
    public List<MenuResponses.Item> items(@RequestParam(required = false) Long categoryId) {
        return service.items(categoryId);
    }

    @GetMapping("/api/admin/menu-items/{id}")
    public MenuResponses.Item item(@PathVariable Long id) {
        return service.item(id);
    }

    @PatchMapping("/api/admin/menu-items/{id}")
    public MenuResponses.Item updateItem(@PathVariable Long id, @Valid @RequestBody MenuItemRequests.Update request) {
        return service.updateItem(id, request);
    }

    @PatchMapping("/api/admin/menu-items/{id}/status")
    public MenuResponses.Item itemStatus(@PathVariable Long id,
            @Valid @RequestBody MenuItemRequests.ChangeActive request) {
        return service.setItemActive(id, request.active());
    }

    @PatchMapping("/api/admin/menu-items/{id}/availability")
    public MenuResponses.Item itemAvailability(@PathVariable Long id,
            @Valid @RequestBody MenuItemRequests.ChangeAvailability request) {
        return service.setItemAvailable(id, request.available());
    }

    // ---- participant ----

    @GetMapping("/api/participant/menu")
    public List<MenuResponses.PublicCategory> participantMenu(
            @RequestHeader(value = "X-Participant-Token", required = false) String token) {
        return service.participantMenu(token);
    }
}
