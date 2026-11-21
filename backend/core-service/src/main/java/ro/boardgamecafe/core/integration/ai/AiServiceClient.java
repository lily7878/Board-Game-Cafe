package ro.boardgamecafe.core.integration.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import ro.boardgamecafe.core.config.AiProperties;

/** HTTP client for the internal AI Service. It never throws: an unusable answer is reported as empty. */
@Component
@EnableConfigurationProperties(AiProperties.class)
public class AiServiceClient {
    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private static final Duration STATUS_TIMEOUT = Duration.ofSeconds(5);

    private final AiProperties properties;
    private final RestClient recommendationsClient;
    private final RestClient rulesClient;
    private final RestClient statusClient;

    public AiServiceClient(AiProperties properties) {
        this.properties = properties;
        this.recommendationsClient = client(properties, properties.recommendationsTimeout());
        this.rulesClient = client(properties, properties.rulesTimeout());
        this.statusClient = client(properties, STATUS_TIMEOUT);
    }

    private static RestClient client(AiProperties properties, Duration readTimeout) {
        // HTTP/1.1 on purpose: the JDK default (HTTP/2) sends an h2c upgrade on plain http, and uvicorn then
        // drops the request body, so every call failed with 422 and Core always fell back.
        HttpClient httpClient = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.connectTimeout()).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(readTimeout);
        return RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory)
                .defaultHeader("X-Internal-Token", properties.internalToken() == null ? "" : properties.internalToken())
                .build();
    }

    public boolean enabled() {
        return properties.enabled();
    }

    public Optional<List<AiRecommendation>> recommend(AiRecommendationRequest request) {
        if (!properties.enabled()) return Optional.empty();
        try {
            AiRecommendationResponse response = recommendationsClient.post().uri("/internal/recommendations")
                    .contentType(MediaType.APPLICATION_JSON).body(request)
                    .retrieve().body(AiRecommendationResponse.class);
            return Optional.ofNullable(response).map(AiRecommendationResponse::items);
        } catch (RestClientException ex) {
            log.warn("AI recommendations unavailable, using fallback: {}", describe(ex));
            return Optional.empty();
        }
    }

    /** Hands a PDF to the AI Service for indexing; false when the service did not accept it. */
    public boolean submitDocument(long documentId, byte[] pdf) {
        if (!properties.enabled()) return false;
        try {
            rulesClient.post().uri("/internal/documents/{id}", documentId)
                    .contentType(MediaType.APPLICATION_PDF).body(pdf).retrieve().toBodilessEntity();
            return true;
        } catch (RestClientException ex) {
            log.warn("AI document upload failed for {}: {}", documentId, describe(ex));
            return false;
        }
    }

    public DocumentState documentStatus(long documentId) {
        if (!properties.enabled()) return DocumentState.unreachable();
        try {
            AiDocumentStatus status = statusClient.get().uri("/internal/documents/{id}", documentId)
                    .retrieve().body(AiDocumentStatus.class);
            return status == null ? DocumentState.unreachable() : DocumentState.found(status);
        } catch (HttpClientErrorException.NotFound ex) {
            return DocumentState.notFound();
        } catch (RestClientException ex) {
            return DocumentState.unreachable();
        }
    }

    public void deleteDocument(long documentId) {
        if (!properties.enabled()) return;
        try {
            statusClient.delete().uri("/internal/documents/{id}", documentId).retrieve().toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("AI document delete failed for {}: {}", documentId, describe(ex));
        }
    }

    public Optional<AiRulesAnswer> answerRules(AiRulesQuestion question) {
        if (!properties.enabled()) return Optional.empty();
        try {
            return Optional.ofNullable(rulesClient.post().uri("/internal/rules/answer")
                    .contentType(MediaType.APPLICATION_JSON).body(question)
                    .retrieve().body(AiRulesAnswer.class));
        } catch (RestClientException ex) {
            log.warn("AI rules assistant unavailable: {}", describe(ex));
            return Optional.empty();
        }
    }

    private static String describe(RestClientException ex) {
        if (ex instanceof org.springframework.web.client.RestClientResponseException response)
            return "HTTP " + HttpStatus.valueOf(response.getStatusCode().value());
        return ex.getClass().getSimpleName();
    }

    public record AiRecommendationRequest(Answers answers, List<Candidate> candidates) {}

    public record Answers(int players, String mood, Integer maxDurationMinutes) {}

    public record Candidate(long id, String title, List<String> categories, int minPlayers, int maxPlayers,
            int durationMinutes, Integer maxDurationMinutes, String difficulty, String description) {}

    public record AiRecommendationResponse(List<AiRecommendation> items) {}

    public record AiRecommendation(Long gameId, String explanation) {}

    public record AiDocumentStatus(Long documentId, String status, Integer pageCount, String failureReason) {}

    /** FOUND: the AI knows the document; NOT_FOUND: it does not; UNREACHABLE: no usable answer right now. */
    public record DocumentState(Kind kind, AiDocumentStatus status) {
        public enum Kind { FOUND, NOT_FOUND, UNREACHABLE }

        static DocumentState found(AiDocumentStatus status) { return new DocumentState(Kind.FOUND, status); }
        static DocumentState notFound() { return new DocumentState(Kind.NOT_FOUND, null); }
        static DocumentState unreachable() { return new DocumentState(Kind.UNREACHABLE, null); }
    }

    public record AiTurn(String role, String content) {}

    public record AiRulesQuestion(long documentId, String question, List<AiTurn> history) {}

    public record AiCitation(Integer page, String excerpt) {}

    public record AiRulesAnswer(String answer, boolean found, List<AiCitation> citations) {}
}
