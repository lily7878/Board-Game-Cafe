package ro.boardgamecafe.core.integration.ai;

import java.net.http.HttpClient;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import ro.boardgamecafe.core.config.AiProperties;

/** HTTP client for the internal AI Service. It never throws: an unusable answer is reported as empty. */
@Component
@EnableConfigurationProperties(AiProperties.class)
public class AiServiceClient {
    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final AiProperties properties;
    private final RestClient restClient;

    public AiServiceClient(AiProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.connectTimeout()).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(properties.recommendationsTimeout());
        this.restClient = RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory)
                .defaultHeader("X-Internal-Token", properties.internalToken() == null ? "" : properties.internalToken())
                .build();
    }

    public Optional<List<AiRecommendation>> recommend(AiRecommendationRequest request) {
        if (!properties.enabled()) return Optional.empty();
        try {
            AiRecommendationResponse response = restClient.post().uri("/internal/recommendations")
                    .contentType(MediaType.APPLICATION_JSON).body(request)
                    .retrieve().body(AiRecommendationResponse.class);
            return Optional.ofNullable(response).map(AiRecommendationResponse::items);
        } catch (RestClientException ex) {
            log.warn("AI recommendations unavailable, using fallback: {}", ex.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    public record AiRecommendationRequest(Answers answers, List<Candidate> candidates) {}

    public record Answers(int players, String mood, Integer maxDurationMinutes) {}

    public record Candidate(long id, String title, List<String> categories, int minPlayers, int maxPlayers,
            int durationMinutes, Integer maxDurationMinutes, String difficulty, String description) {}

    public record AiRecommendationResponse(List<AiRecommendation> items) {}

    public record AiRecommendation(Long gameId, String explanation) {}
}
