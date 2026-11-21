package ro.boardgamecafe.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AskResponse;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.Citation;
import ro.boardgamecafe.core.domain.game.RuleDocument;
import ro.boardgamecafe.core.domain.game.RuleDocumentStatus;
import ro.boardgamecafe.core.exception.TooManyRequestsException;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiCitation;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRulesAnswer;

class RulesAssistantServiceTest {

    static final class MutableClock extends Clock {
        Instant now = Instant.parse("2026-11-21T18:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test
    void foundAnswerKeepsItsCitations() {
        AskResponse response = RulesAssistantService.validated(new AiRulesAnswer(" Mutați hoțul. ", true,
                List.of(new AiCitation(2, "Then move the robber."), new AiCitation(null, "x"), new AiCitation(0, "y"))));
        assertThat(response).isEqualTo(new AskResponse("Mutați hoțul.", true, List.of(new Citation(2, "Then move the robber."))));
    }

    @Test
    void answerWithoutCitationIsNotAccepted() {
        AskResponse response = RulesAssistantService.validated(new AiRulesAnswer("Inventat.", true, List.of()));
        assertThat(response).isEqualTo(new AskResponse(RulesAssistantService.NOT_FOUND, false, List.of()));
        assertThat(RulesAssistantService.validated(new AiRulesAnswer("", false, null)).found()).isFalse();
    }

    @Test
    void tenQuestionsPerMinuteThenRetryAfter() {
        MutableClock clock = new MutableClock();
        RulesAssistantService service = new RulesAssistantService(null, null, null, null, clock);
        for (int i = 0; i < RulesAssistantService.MAX_QUESTIONS; i++) service.checkRate(1L);

        assertThatThrownBy(() -> service.checkRate(1L)).isInstanceOf(TooManyRequestsException.class)
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getHeaders().getFirst("Retry-After")).isEqualTo("61"));
        service.checkRate(2L); // another participant has its own limit

        clock.now = clock.now.plusSeconds(61);
        service.checkRate(1L);
    }

    @Test
    void onlyRealPdfsAreAccepted() {
        assertThatThrownBy(() -> RuleDocumentService.validatedBytes(
                new MockMultipartFile("file", "x.pdf", "application/pdf", "hello".getBytes())))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("PDF");
        byte[] pdf = "%PDF-1.4 ...".getBytes();
        assertThat(RuleDocumentService.validatedBytes(new MockMultipartFile("file", "x.pdf", "application/pdf", pdf))).isEqualTo(pdf);

        byte[] big = new byte[(int) RuleDocumentService.MAX_BYTES + 1];
        Arrays.fill(big, (byte) ' ');
        System.arraycopy(pdf, 0, big, 0, pdf.length);
        assertThatThrownBy(() -> RuleDocumentService.validatedBytes(new MockMultipartFile("file", "x.pdf", "application/pdf", big)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("20 MB");
    }

    @Test
    void fileNameLosesItsPath() {
        assertThat(RuleDocumentService.cleanFileName("C:\\Users\\x\\Catan rules.pdf")).isEqualTo("Catan rules.pdf");
        assertThat(RuleDocumentService.cleanFileName(null)).isEqualTo("manual.pdf");
    }

    @Test
    void onlyAReadyDocumentCanBecomeActive() {
        RuleDocument doc = new RuleDocument(1L, "m.pdf", 10, "a".repeat(64), "1/x.pdf", 1L, Instant.now());
        assertThatThrownBy(doc::activate).isInstanceOf(IllegalStateException.class);

        doc.markReady(12, Instant.now());
        doc.markFailed("late failure is ignored", Instant.now());
        doc.activate();
        assertThat(doc.getStatus()).isEqualTo(RuleDocumentStatus.READY);
        assertThat(doc.isActive()).isTrue();

        doc.remove(Instant.now());
        assertThat(doc.isActive()).isFalse();
        assertThatThrownBy(doc::activate).isInstanceOf(IllegalStateException.class);
    }
}
