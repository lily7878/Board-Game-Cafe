package ro.boardgamecafe.core.api.table;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.table.dto.LiveViewResponses;
import ro.boardgamecafe.core.service.LiveViewService;
import ro.boardgamecafe.core.service.SessionAccessService;

/** Read endpoints behind the live screens of the staff and participant UIs. */
@RestController
public class LiveViewController {
    private final LiveViewService service;
    private final SessionAccessService accessService;

    public LiveViewController(LiveViewService service, SessionAccessService accessService) {
        this.service = service;
        this.accessService = accessService;
    }

    @GetMapping("/api/admin/tables/overview")
    public List<LiveViewResponses.TableCard> tables() {
        return service.tables();
    }

    @GetMapping("/api/admin/sessions/{sessionId}")
    public LiveViewResponses.SessionDetails session(@PathVariable Long sessionId) {
        return service.session(sessionId);
    }

    @GetMapping("/api/participant/sessions/current")
    public LiveViewResponses.CurrentSession current(
            @RequestHeader(value = "X-Participant-Token", required = false) String token) {
        return service.currentForParticipant(token);
    }

    /** Public, before the PIN: the table number for a valid QR token of an ACTIVE session; 404 otherwise. */
    @PostMapping("/api/participant/sessions/join-info")
    public LiveViewResponses.JoinInfo joinInfo(@Valid @RequestBody LiveViewResponses.JoinInfoRequest request) {
        return accessService.joinInfo(request.joinToken());
    }

    @GetMapping("/api/participant/cafe-info")
    public LiveViewResponses.CafeInfo cafeInfo() {
        return service.cafeInfo();
    }
}
