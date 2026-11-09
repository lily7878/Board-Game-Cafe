package ro.boardgamecafe.core.api.game;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.game.dto.*;
import ro.boardgamecafe.core.service.GameService;

@RestController
@RequestMapping("/api/admin/games")
public class GameController {
    private final GameService service;

    public GameController(GameService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameResponse create(@Valid @RequestBody CreateGameRequest request) {
        return service.createGame(request);
    }

    @GetMapping
    public List<GameResponse> findAll() {
        return service.getAllGames();
    }

    @GetMapping("/{id}")
    public GameResponse find(@PathVariable Long id) {
        return service.getGameById(id);
    }

    @PatchMapping("/{id}")
    public GameResponse update(@PathVariable Long id, @Valid @RequestBody UpdateGameRequest request) {
        return service.updateGame(id, request);
    }

    @PatchMapping("/{id}/status")
    public GameResponse status(@PathVariable Long id, @Valid @RequestBody GameStatusRequest request) {
        return service.setGameActive(id, request.active());
    }
}
