package ro.boardgamecafe.core.config;

import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.repository.StaffUserRepository;

@Configuration
public class StaffJwtConfig {
    public static final String ISSUER = "board-game-cafe-core";

    @Bean
    SecretKey staffJwtKey(@Value("${BGC_STAFF_JWT_KEY:}") String encoded) {
        try {
            byte[] bytes = Base64.getDecoder().decode(encoded);
            if (bytes.length == 32) return new SecretKeySpec(bytes, "HmacSHA256");
        } catch (IllegalArgumentException ignored) {
            // A missing or invalid key must prevent startup.
        }
        throw new IllegalStateException("BGC_STAFF_JWT_KEY must be a Base64-encoded 32-byte key.");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey staffJwtKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(staffJwtKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey staffJwtKey) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(staffJwtKey)
                .macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));
        return decoder;
    }

    @Bean
    Converter<Jwt, AbstractAuthenticationToken> staffJwtConverter(
            StaffUserRepository repository) {
        return jwt -> {
            Object claim = jwt.getClaim("staffId");
            if (!(claim instanceof Number number)) throw new BadCredentialsException("Invalid staff token.");
            StaffUser staff = repository.findById(number.longValue())
                    .orElseThrow(() -> new BadCredentialsException("Invalid staff token."));
            if (!staff.isActive() || !staff.getEmail().equalsIgnoreCase(jwt.getSubject()))
                throw new BadCredentialsException("Invalid staff token.");
            return new JwtAuthenticationToken(jwt,
                    List.of(new SimpleGrantedAuthority("ROLE_" + staff.getRole().name())), staff.getEmail());
        };
    }
}
