package ro.boardgamecafe.core.api.game;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ro.boardgamecafe.core.api.game.dto.ChangeGameCopyStatusRequest;
import ro.boardgamecafe.core.api.game.dto.CreateGameCopyRequest;
import ro.boardgamecafe.core.api.game.dto.GameCopyResponse;
import ro.boardgamecafe.core.api.game.dto.GameCopySummaryResponse;
import ro.boardgamecafe.core.service.GameCopyService;

@RestController
@RequestMapping("/api/admin")
public class GameCopyController {
    private final GameCopyService service;

    public GameCopyController(GameCopyService service) {
        this.service = service;
    }

    @PostMapping("/games/{gameId}/copies")
    @ResponseStatus(HttpStatus.CREATED)
    public GameCopyResponse create(@PathVariable Long gameId, @Valid @RequestBody CreateGameCopyRequest request) {
        return service.create(gameId, request);
    }

    @GetMapping("/games/{gameId}/copies")
    public List<GameCopyResponse> findByGame(@PathVariable Long gameId) {
        return service.findByGame(gameId);
    }

    @GetMapping("/games/{gameId}/copies/summary")
    public GameCopySummaryResponse summary(@PathVariable Long gameId) {
        return service.summary(gameId);
    }

    @GetMapping("/game-copies/{id}")
    public GameCopyResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PatchMapping("/game-copies/{id}/status")
    public GameCopyResponse changeStatus(@PathVariable Long id,
            @Valid @RequestBody ChangeGameCopyStatusRequest request) {
        return service.changeStatus(id, request);
    }
}
