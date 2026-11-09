package ro.boardgamecafe.core.api.game;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import ro.boardgamecafe.core.api.game.dto.GameCatalogCriteria;
import ro.boardgamecafe.core.api.game.dto.GameCatalogPageResponse;
import ro.boardgamecafe.core.api.game.dto.GameCatalogResponse;
import ro.boardgamecafe.core.api.game.dto.PublicGameCategoryResponse;
import ro.boardgamecafe.core.domain.game.GameDifficulty;
import ro.boardgamecafe.core.service.GameCatalogService;
import ro.boardgamecafe.core.service.SessionAccessService;

@RestController
@RequestMapping("/api/participant")
public class GameCatalogController {
    private final GameCatalogService service;
    private final SessionAccessService accessService;

    public GameCatalogController(GameCatalogService service, SessionAccessService accessService) {
        this.service = service;
        this.accessService = accessService;
    }

    @GetMapping("/games/search")
    public GameCatalogPageResponse search(
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer players,
            @RequestParam(required = false) Integer maxDurationMinutes,
            @RequestParam(required = false) Integer age,
            @RequestParam(required = false) GameDifficulty difficulty,
            @RequestParam(defaultValue = "false") boolean availableOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        accessService.authenticate(participantToken);
        GameCatalogCriteria criteria = new GameCatalogCriteria(
                categoryId, players, maxDurationMinutes, age, difficulty, availableOnly);
        return service.search(criteria, page, size, sortBy, direction);
    }

    @GetMapping("/games/{id}")
    public GameCatalogResponse findById(@PathVariable Long id,
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken) {
        accessService.authenticate(participantToken);
        return service.findById(id);
    }

    @GetMapping("/game-categories")
    public List<PublicGameCategoryResponse> categories(
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken) {
        accessService.authenticate(participantToken);
        return service.categories();
    }
}
