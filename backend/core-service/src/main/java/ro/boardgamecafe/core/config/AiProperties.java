package ro.boardgamecafe.core.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Connection to the internal AI Service. An empty internal token disables AI: recommendations then always use
 * the deterministic fallback and the rules assistant is unavailable, so Core works without the AI Service.
 */
@ConfigurationProperties("bgc.ai")
public record AiProperties(String baseUrl, String internalToken, Duration connectTimeout,
        Duration recommendationsTimeout, Duration rulesTimeout) {

    public AiProperties {
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "http://127.0.0.1:8081";
        if (connectTimeout == null) connectTimeout = Duration.ofSeconds(2);
        if (recommendationsTimeout == null) recommendationsTimeout = Duration.ofSeconds(45);
        if (rulesTimeout == null) rulesTimeout = Duration.ofSeconds(70);
    }

    public boolean enabled() {
        return internalToken != null && !internalToken.isBlank();
    }
}
