package ro.boardgamecafe.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import jakarta.servlet.DispatcherType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

@Configuration
public class ApiSecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> staffJwtConverter) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/api/participant/games/**",
                        "/api/participant/game-categories").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/setup/manager",
                        "/api/participant/sessions/join", "/api/admin/auth/login").permitAll()
                .requestMatchers("/api/participant/sessions/current",
                        "/api/participant/sessions/current/**",
                        "/api/participant/game-requests", "/api/participant/game-requests/**",
                        "/api/participant/menu", "/api/participant/orders", "/api/participant/orders/**").permitAll()
                .requestMatchers("/api/admin/me", "/api/admin/me/password",
                        "/api/admin/auth/me").hasAnyRole("STAFF", "MANAGER")
                .requestMatchers("/api/admin/staff", "/api/admin/staff/**").hasRole("MANAGER")
                .requestMatchers("/api/admin/games", "/api/admin/games/**",
                        "/api/admin/game-categories", "/api/admin/game-categories/**",
                        "/api/admin/game-copies/**", "/api/admin/menu-categories", "/api/admin/menu-categories/**",
                        "/api/admin/menu-items", "/api/admin/menu-items/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/admin/settings", "/api/admin/opening-hours",
                        "/api/admin/business-days/current").hasAnyRole("STAFF", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/admin/settings", "/api/admin/opening-hours/*")
                        .hasRole("MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/admin/tables/*/sessions").hasAnyRole("STAFF", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/admin/tables").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/admin/tables/**").hasRole("MANAGER")
                .requestMatchers("/api/admin/tables", "/api/admin/tables/**", "/api/admin/game-requests/**",
                        "/api/admin/orders", "/api/admin/orders/**",
                        "/api/admin/sessions/**").hasAnyRole("STAFF", "MANAGER")
                .anyRequest().denyAll())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(staffJwtConverter)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"));
        return http.build();
    }
}
