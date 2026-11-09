package ro.boardgamecafe.core.api.order;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.order.dto.OrderRequests;
import ro.boardgamecafe.core.api.order.dto.OrderResponse;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.service.FoodOrderService;

@RestController
public class FoodOrderController {
    private static final String PARTICIPANT_TOKEN = "X-Participant-Token";
    private final FoodOrderService service;

    public FoodOrderController(FoodOrderService service) {
        this.service = service;
    }

    // ---- participant ----

    @PostMapping("/api/participant/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse place(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token,
            @Valid @RequestBody OrderRequests.Place request) {
        return service.place(token, request);
    }

    @GetMapping("/api/participant/orders")
    public List<OrderResponse> mine(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token) {
        return service.mine(token);
    }

    @PutMapping("/api/participant/orders/{id}")
    public OrderResponse replaceLines(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token,
            @PathVariable Long id, @Valid @RequestBody OrderRequests.Place request) {
        return service.replaceLines(token, id, request);
    }

    @PostMapping("/api/participant/orders/{id}/cancel")
    public OrderResponse cancelMine(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token,
            @PathVariable Long id) {
        return service.cancelByParticipant(token, id);
    }

    // ---- staff ----

    @GetMapping("/api/admin/orders")
    public List<OrderResponse> list(@RequestParam(required = false) Set<OrderStatus> status) {
        return service.list(status);
    }

    @GetMapping("/api/admin/orders/{id}")
    public OrderResponse find(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/api/admin/sessions/{sessionId}/orders")
    public List<OrderResponse> forSession(@PathVariable Long sessionId) {
        return service.forSession(sessionId);
    }

    @PostMapping("/api/admin/orders/{id}/process")
    public OrderResponse process(@PathVariable Long id, @Valid @RequestBody OrderRequests.Process request,
            Principal principal) {
        return service.process(id, request, principal.getName());
    }

    @PatchMapping("/api/admin/orders/{id}/status")
    public OrderResponse changeStatus(@PathVariable Long id, @Valid @RequestBody OrderRequests.ChangeStatus request,
            Principal principal) {
        return service.changeStatus(id, request.status(), principal.getName());
    }
}
