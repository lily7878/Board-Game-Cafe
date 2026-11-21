package ro.boardgamecafe.core.integration.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import ro.boardgamecafe.core.config.AiProperties;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRecommendation;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRecommendationRequest;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.Answers;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.Candidate;

class AiServiceClientTest {
    private static final AiRecommendationRequest REQUEST = new AiRecommendationRequest(
            new Answers(4, "TEAM", 60),
            List.of(new Candidate(1, "Pandemic", List.of("Cooperativ"), 2, 4, 45, null, "MEDIUM", "desc")));

    private HttpServer server;

    @AfterEach
    void stop() {
        if (server != null) server.stop(0);
    }

    private String start(int status, String body, long delayMillis, AtomicReference<String> tokenSeen) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/internal/recommendations", (HttpExchange exchange) -> {
            tokenSeen.set(exchange.getRequestHeaders().getFirst("X-Internal-Token"));
            exchange.getRequestBody().readAllBytes();
            try { Thread.sleep(delayMillis); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private static AiServiceClient client(String baseUrl, String token, Duration timeout) {
        return new AiServiceClient(new AiProperties(baseUrl, token, Duration.ofSeconds(1), timeout));
    }

    @Test
    void sendsInternalTokenAndReadsItems() throws IOException {
        AtomicReference<String> token = new AtomicReference<>();
        String url = start(200, "{\"items\":[{\"gameId\":1,\"explanation\":\"Jucați împreună.\"}]}", 0, token);

        var result = client(url, "secret-token-123456", Duration.ofSeconds(2)).recommend(REQUEST);

        assertThat(token.get()).isEqualTo("secret-token-123456");
        assertThat(result).contains(List.of(new AiRecommendation(1L, "Jucați împreună.")));
    }

    @Test
    void slowAnswerIsEmpty() throws IOException {
        String url = start(200, "{\"items\":[]}", 1500, new AtomicReference<>());
        assertThat(client(url, "secret-token-123456", Duration.ofMillis(300)).recommend(REQUEST)).isEmpty();
    }

    @Test
    void errorStatusIsEmpty() throws IOException {
        String url = start(503, "{\"detail\":\"Model unavailable.\"}", 0, new AtomicReference<>());
        assertThat(client(url, "secret-token-123456", Duration.ofSeconds(2)).recommend(REQUEST)).isEmpty();
    }

    @Test
    void withoutTokenAiIsOffAndNothingIsSent() throws IOException {
        AtomicReference<String> token = new AtomicReference<>("not called");
        String url = start(200, "{\"items\":[]}", 0, token);
        assertThat(client(url, "", Duration.ofSeconds(2)).recommend(REQUEST)).isEmpty();
        assertThat(token.get()).isEqualTo("not called");
    }

    @Test
    void unreachableServiceIsEmpty() {
        assertThat(client("http://127.0.0.1:1", "secret-token-123456", Duration.ofSeconds(1)).recommend(REQUEST)).isEmpty();
    }
}
