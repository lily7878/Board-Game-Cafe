package ro.boardgamecafe.core.api.billing;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.billing.dto.BillResponse;
import ro.boardgamecafe.core.api.billing.dto.BillingRequests;
import ro.boardgamecafe.core.api.billing.dto.PaymentResponse;
import ro.boardgamecafe.core.service.CheckoutService;
import ro.boardgamecafe.core.service.PaymentService;

@RestController
public class BillingController {
    private static final String PARTICIPANT_TOKEN = "X-Participant-Token";
    private final CheckoutService checkoutService;
    private final PaymentService paymentService;

    public BillingController(CheckoutService checkoutService, PaymentService paymentService) {
        this.checkoutService = checkoutService;
        this.paymentService = paymentService;
    }

    // ---- participant ----

    @GetMapping("/api/participant/sessions/current/bill")
    public BillResponse bill(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token) {
        return checkoutService.billForParticipant(token);
    }

    @PutMapping("/api/participant/sessions/current/fees")
    public BillResponse declarePersons(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token,
            @Valid @RequestBody BillingRequests.SetPersons request) {
        return checkoutService.declarePersons(token, request.persons());
    }

    @PostMapping("/api/participant/sessions/current/checkout")
    public BillResponse checkout(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token) {
        return checkoutService.checkout(token);
    }

    /** 201 for a new attempt, 200 when the result of an earlier request with the same key is replayed. */
    @PostMapping("/api/participant/sessions/current/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestHeader(value = PARTICIPANT_TOKEN, required = false) String token,
            @Valid @RequestBody BillingRequests.Pay request) {
        PaymentService.Result result = paymentService.pay(token, request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.payment());
    }

    // ---- staff ----

    @GetMapping("/api/admin/sessions/{sessionId}/bill")
    public BillResponse billForStaff(@PathVariable Long sessionId) {
        return checkoutService.billForStaff(sessionId);
    }

    @PutMapping("/api/admin/sessions/{sessionId}/fees")
    public BillResponse setPersons(@PathVariable Long sessionId, @Valid @RequestBody BillingRequests.SetPersons request,
            Principal principal) {
        return checkoutService.setPersonsByStaff(sessionId, request.persons(), principal.getName());
    }

    @PostMapping("/api/admin/sessions/{sessionId}/reopen")
    public BillResponse reopen(@PathVariable Long sessionId) {
        return checkoutService.reopen(sessionId);
    }

    @GetMapping("/api/admin/sessions/{sessionId}/payments")
    public List<PaymentResponse> payments(@PathVariable Long sessionId) {
        return paymentService.forSession(sessionId);
    }
}
