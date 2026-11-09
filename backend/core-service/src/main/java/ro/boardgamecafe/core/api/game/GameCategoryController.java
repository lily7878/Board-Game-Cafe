package ro.boardgamecafe.core.api.game;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.game.dto.*;
import ro.boardgamecafe.core.service.GameCategoryService;

@RestController
@RequestMapping("/api/admin/game-categories")
public class GameCategoryController {
    private final GameCategoryService service;

    public GameCategoryController(GameCategoryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameCategoryResponse create(@Valid @RequestBody CreateGameCategoryRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<GameCategoryResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public GameCategoryResponse find(@PathVariable Long id) {
        return service.findById(id);
    }

    @PatchMapping("/{id}")
    public GameCategoryResponse update(@PathVariable Long id, @Valid @RequestBody UpdateGameCategoryRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public GameCategoryResponse status(@PathVariable Long id, @Valid @RequestBody CategoryStatusRequest request) {
        return service.setActive(id, request.active());
    }
}
