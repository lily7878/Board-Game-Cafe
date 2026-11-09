package ro.boardgamecafe.core.api.table;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.table.dto.JoinTableSessionRequest;
import ro.boardgamecafe.core.api.table.dto.JoinTableSessionResponse;
import ro.boardgamecafe.core.api.table.dto.OpenTableSessionResponse;
import ro.boardgamecafe.core.api.table.dto.SessionParticipantResponse;
import ro.boardgamecafe.core.service.SessionAccessService;

@RestController
public class TableSessionController {
    private final SessionAccessService service;
    public TableSessionController(SessionAccessService service) { this.service = service; }

    @PostMapping("/api/admin/tables/{tableId}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public OpenTableSessionResponse open(@PathVariable Long tableId, Principal principal) {
        return service.open(tableId, principal.getName());
    }

    @GetMapping("/api/admin/tables/{tableId}/sessions/current/access")
    public OpenTableSessionResponse preview(@PathVariable Long tableId) { return service.preview(tableId); }

    @PostMapping("/api/participant/sessions/join")
    @ResponseStatus(HttpStatus.CREATED)
    public JoinTableSessionResponse join(@Valid @RequestBody JoinTableSessionRequest request) {
        return service.join(request);
    }

    @GetMapping("/api/participant/sessions/current")
    public SessionParticipantResponse current(@RequestHeader(value = "X-Participant-Token", required = false) String token) {
        return service.current(token);
    }

    @PostMapping("/api/participant/sessions/current/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@RequestHeader(value = "X-Participant-Token", required = false) String token) { service.leave(token); }
}
