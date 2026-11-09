package ro.boardgamecafe.core.api.staff;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.staff.dto.*;
import ro.boardgamecafe.core.service.StaffUserService;

@RestController
public class StaffUserController {
    private final StaffUserService service;
    public StaffUserController(StaffUserService service) { this.service = service; }

    @PostMapping("/api/setup/manager")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffUserResponse bootstrap(@RequestHeader(value = "X-Bootstrap-Token", required = false) String token,
            @Valid @RequestBody BootstrapManagerRequest request) {
        return service.bootstrap(token, request);
    }

    @GetMapping("/api/admin/me")
    public StaffUserResponse me(Principal principal) { return service.current(principal.getName()); }

    @PatchMapping("/api/admin/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeOwnPassword(Principal principal, @Valid @RequestBody ChangeOwnPasswordRequest request) {
        service.changeOwnPassword(principal.getName(), request.currentPassword(), request.newPassword());
    }

    @PostMapping("/api/admin/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffUserResponse create(@Valid @RequestBody CreateStaffUserRequest request) { return service.create(request); }

    @GetMapping("/api/admin/staff")
    public List<StaffUserResponse> all() { return service.findAll(); }

    @PatchMapping("/api/admin/staff/{id}/status")
    public StaffUserResponse status(@PathVariable Long id, @Valid @RequestBody ChangeStaffStatusRequest request) {
        return service.setActive(id, request.active());
    }
}
