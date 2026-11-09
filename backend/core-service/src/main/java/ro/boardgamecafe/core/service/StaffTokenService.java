package ro.boardgamecafe.core.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.staff.dto.StaffLoginResponse;
import ro.boardgamecafe.core.config.StaffJwtConfig;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.repository.StaffUserRepository;

@Service
@Transactional(readOnly = true)
public class StaffTokenService {
    private final StaffUserRepository repository;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;

    public StaffTokenService(StaffUserRepository repository, PasswordEncoder encoder, JwtEncoder jwtEncoder) {
        this.repository = repository; this.encoder = encoder; this.jwtEncoder = jwtEncoder;
    }

    public StaffLoginResponse login(String email, String password) {
        StaffUser staff = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> unauthorized());
        if (!staff.isActive() || !encoder.matches(password, staff.getPasswordHash())) throw unauthorized();
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(60, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(StaffJwtConfig.ISSUER)
                .subject(staff.getEmail())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .id(UUID.randomUUID().toString())
                .claim("staffId", staff.getId())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new StaffLoginResponse(token, "Bearer", expiresAt,
                staff.getId(), staff.getFullName(), staff.getRole());
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid staff credentials.");
    }
}
