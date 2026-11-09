package ro.boardgamecafe.core.api.staff;

import java.security.Principal;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ro.boardgamecafe.core.api.staff.dto.StaffLoginRequest;
import ro.boardgamecafe.core.api.staff.dto.StaffLoginResponse;
import ro.boardgamecafe.core.api.staff.dto.StaffUserResponse;
import ro.boardgamecafe.core.service.StaffTokenService;
import ro.boardgamecafe.core.service.StaffUserService;

@RestController
public class StaffAuthController {
    private final StaffTokenService tokenService;
    private final StaffUserService staffService;

    public StaffAuthController(StaffTokenService tokenService, StaffUserService staffService) {
        this.tokenService = tokenService; this.staffService = staffService;
    }

    @PostMapping("/api/admin/auth/login")
    public StaffLoginResponse login(@Valid @RequestBody StaffLoginRequest request) {
        return tokenService.login(request.email(), request.password());
    }

    @GetMapping("/api/admin/auth/me")
    public StaffUserResponse me(Principal principal) { return staffService.current(principal.getName()); }
}
