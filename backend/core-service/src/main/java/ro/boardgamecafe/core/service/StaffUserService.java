package ro.boardgamecafe.core.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Locale;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.staff.dto.BootstrapManagerRequest;
import ro.boardgamecafe.core.api.staff.dto.CreateStaffUserRequest;
import ro.boardgamecafe.core.api.staff.dto.StaffUserResponse;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.exception.GameRequestConflictException;
import ro.boardgamecafe.core.repository.StaffUserRepository;

@Service
@Transactional(readOnly = true)
public class StaffUserService {
    private final StaffUserRepository repository;
    private final PasswordEncoder encoder;
    private final EntityManager entityManager;
    private final String bootstrapToken;

    public StaffUserService(StaffUserRepository repository, PasswordEncoder encoder, EntityManager entityManager,
            @Value("${BGC_BOOTSTRAP_TOKEN:}") String bootstrapToken) {
        this.repository = repository; this.encoder = encoder; this.entityManager = entityManager;
        this.bootstrapToken = bootstrapToken;
    }

    @Transactional
    public StaffUserResponse bootstrap(String suppliedToken, BootstrapManagerRequest request) {
        if (bootstrapToken.length() < 32)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Bootstrap token is not configured.");
        if (suppliedToken == null || !MessageDigest.isEqual(
                suppliedToken.getBytes(StandardCharsets.UTF_8), bootstrapToken.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bootstrap token.");
        lockBootstrapGuard();
        if (repository.count() != 0)
            throw new GameRequestConflictException("The first manager has already been created.");
        validatePassword(request.password());
        StaffUser manager = repository.save(new StaffUser(request.fullName(), request.email(),
                encoder.encode(request.password()), StaffRole.MANAGER));
        return response(manager);
    }

    @Transactional
    public StaffUserResponse create(CreateStaffUserRequest request) {
        validatePassword(request.password());
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        if (repository.existsByEmailIgnoreCase(email)) throw new DuplicateKeyException("Email is already in use.");
        return response(repository.save(new StaffUser(request.fullName(), email,
                encoder.encode(request.password()), request.role())));
    }

    public List<StaffUserResponse> findAll() { return repository.findAllByOrderByIdAsc().stream().map(StaffUserService::response).toList(); }
    public StaffUserResponse current(String email) { return response(findByEmail(email)); }

    @Transactional
    public StaffUserResponse setActive(Long id, boolean active) {
        lockBootstrapGuard();
        StaffUser user = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found with id: " + id));
        if (!active && user.isActive() && user.getRole() == StaffRole.MANAGER
                && repository.countByRoleAndActiveTrue(StaffRole.MANAGER) <= 1)
            throw new GameRequestConflictException("The last active manager cannot be deactivated.");
        user.setActive(active);
        return response(user);
    }

    @Transactional
    public void changeOwnPassword(String email, String currentPassword, String newPassword) {
        StaffUser user = findByEmail(email);
        if (!encoder.matches(currentPassword, user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect.");
        validatePassword(newPassword);
        user.changePasswordHash(encoder.encode(newPassword));
    }

    private StaffUser findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
    }
    private void lockBootstrapGuard() {
        entityManager.createNativeQuery("SELECT id FROM bootstrap_guard WHERE id = 1 FOR UPDATE").getSingleResult();
    }
    private static void validatePassword(String password) {
        if (password == null || password.length() < 12 || password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Password must contain at least 12 characters and at most 72 UTF-8 bytes.");
    }
    private static StaffUserResponse response(StaffUser user) {
        return new StaffUserResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole(), user.isActive(), user.getCreatedAt());
    }
}
