package ro.boardgamecafe.core.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AskRequest;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AskResponse;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.Citation;
import ro.boardgamecafe.core.domain.game.RuleDocument;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.exception.TooManyRequestsException;
import ro.boardgamecafe.core.integration.ai.AiServiceClient;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiRulesAnswer;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.AiTurn;
import ro.boardgamecafe.core.repository.GameRepository;
import ro.boardgamecafe.core.repository.RuleDocumentRepository;

/**
 * Rules assistant: only for participants of an ACTIVE session, only for games with a READY manual. The AI Service
 * receives the question, the last turns and the document id: no names, tokens or table data.
 */
@Service
public class RulesAssistantService {
    static final int MAX_QUESTIONS = 10;
    static final Duration WINDOW = Duration.ofMinutes(1);
    static final String NOT_FOUND = "Manualul nu spune asta. Întrebați personalul.";

    private final SessionAccessService accessService;
    private final GameRepository gameRepository;
    private final RuleDocumentRepository documentRepository;
    private final AiServiceClient aiClient;
    private final Clock clock;
    private final Map<Long, Deque<Instant>> questionsByParticipant = new ConcurrentHashMap<>();

    @Autowired
    public RulesAssistantService(SessionAccessService accessService, GameRepository gameRepository,
            RuleDocumentRepository documentRepository, AiServiceClient aiClient) {
        this(accessService, gameRepository, documentRepository, aiClient, Clock.systemUTC());
    }

    RulesAssistantService(SessionAccessService accessService, GameRepository gameRepository,
            RuleDocumentRepository documentRepository, AiServiceClient aiClient, Clock clock) {
        this.accessService = accessService;
        this.gameRepository = gameRepository;
        this.documentRepository = documentRepository;
        this.aiClient = aiClient;
        this.clock = clock;
    }

    public AskResponse ask(String participantToken, Long gameId, AskRequest request) {
        SessionParticipant participant = accessService.authenticate(participantToken);
        if (participant.getSession().getStatus() != SessionStatus.ACTIVE)
            throw new ConflictException("Asistentul de reguli este disponibil doar cât timp masa este activă.");
        if (gameRepository.findByIdAndActiveTrue(gameId).isEmpty())
            throw new EntityNotFoundException("Game not found with id: " + gameId);
        RuleDocument document = documentRepository.findByGameIdAndActiveTrue(gameId)
                .orElseThrow(() -> new ConflictException("Regulile acestui joc nu sunt disponibile."));
        checkRate(participant.getId());

        List<AiTurn> history = request.history() == null ? List.of()
                : request.history().stream().map(t -> new AiTurn(t.role(), t.content().strip())).toList();
        AiRulesAnswer answer = aiClient.answerRules(new AiServiceClient.AiRulesQuestion(
                        document.getId(), request.question().strip(), history))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Asistentul de reguli nu răspunde acum. Încercați din nou."));
        return validated(answer);
    }

    /** A "found" answer must carry at least one page; otherwise it is replaced by the explicit "not in the manual". */
    static AskResponse validated(AiRulesAnswer answer) {
        List<Citation> citations = answer.citations() == null ? List.of() : answer.citations().stream()
                .filter(c -> c != null && c.page() != null && c.page() > 0)
                .map(c -> new Citation(c.page(), c.excerpt() == null ? "" : c.excerpt()))
                .toList();
        String text = answer.answer() == null ? "" : answer.answer().strip();
        if (!answer.found() || citations.isEmpty() || text.isEmpty()) return new AskResponse(NOT_FOUND, false, List.of());
        return new AskResponse(text, true, citations);
    }

    void checkRate(Long participantId) {
        Instant now = clock.instant();
        Deque<Instant> times = questionsByParticipant.computeIfAbsent(participantId, id -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && !times.peekFirst().isAfter(now.minus(WINDOW))) times.pollFirst();
            if (times.size() >= MAX_QUESTIONS) {
                long wait = Duration.between(now, times.peekFirst().plus(WINDOW)).toSeconds() + 1;
                throw new TooManyRequestsException("Prea multe întrebări. Încercați din nou peste " + wait + " s.", wait);
            }
            times.addLast(now);
        }
    }
}
