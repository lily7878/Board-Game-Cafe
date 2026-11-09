package ro.boardgamecafe.core.api.game;

import java.util.List;
import java.security.Principal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.game.dto.CreateGameRequestForSession;
import ro.boardgamecafe.core.api.game.dto.GameRequestResponse;
import ro.boardgamecafe.core.api.game.dto.ResolveGameRequest;
import ro.boardgamecafe.core.api.game.dto.ReturnGameRequest;
import ro.boardgamecafe.core.service.GameRequestService;

@RestController
public class GameRequestController {
    private final GameRequestService service;
    public GameRequestController(GameRequestService service) { this.service = service; }

    @PostMapping("/api/participant/game-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public GameRequestResponse request(@RequestHeader(value = "X-Participant-Token", required = false) String token,
            @Valid @RequestBody CreateGameRequestForSession body) {
        return service.request(token, body.gameId());
    }
    @GetMapping("/api/participant/game-requests")
    public List<GameRequestResponse> mine(@RequestHeader(value = "X-Participant-Token", required = false) String token) {
        return service.forParticipant(token);
    }
    @PostMapping("/api/participant/game-requests/{id}/cancel")
    public GameRequestResponse cancelMine(@RequestHeader(value = "X-Participant-Token", required = false) String token, @PathVariable Long id) {
        return service.cancelByParticipant(token, id);
    }

    @GetMapping("/api/admin/sessions/{sessionId}/game-requests")
    public List<GameRequestResponse> forSession(@PathVariable Long sessionId) { return service.forSession(sessionId); }
    @GetMapping("/api/admin/game-requests/{id}")
    public GameRequestResponse find(@PathVariable Long id) { return service.findById(id); }
    @PostMapping("/api/admin/game-requests/{id}/reserve")
    public GameRequestResponse reserve(@PathVariable Long id, Principal principal) {
        return service.reserve(id, principal.getName());
    }
    @PostMapping("/api/admin/game-requests/{id}/deliver")
    public GameRequestResponse deliver(@PathVariable Long id, Principal principal) {
        return service.deliver(id, principal.getName());
    }
    @PostMapping("/api/admin/game-requests/{id}/return")
    public GameRequestResponse returnCopy(@PathVariable Long id, @Valid @RequestBody ReturnGameRequest body,
            Principal principal) {
        return service.returnCopy(id, body.conditionStatus(), principal.getName());
    }
    @PostMapping("/api/admin/game-requests/{id}/reject")
    public GameRequestResponse reject(@PathVariable Long id, @Valid @RequestBody ResolveGameRequest body,
            Principal principal) {
        return service.reject(id, body.reason(), principal.getName());
    }
    @PostMapping("/api/admin/game-requests/{id}/cancel")
    public GameRequestResponse cancel(@PathVariable Long id, @Valid @RequestBody ResolveGameRequest body,
            Principal principal) {
        return service.cancelByStaff(id, body.reason(), principal.getName());
    }
}
