package ro.boardgamecafe.core.api.ai;

import java.security.Principal;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AdminRules;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AskRequest;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AskResponse;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.RuleDocumentResponse;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.RulesStatus;
import ro.boardgamecafe.core.service.RuleDocumentService;
import ro.boardgamecafe.core.service.RulesAssistantService;
import ro.boardgamecafe.core.service.SessionAccessService;

@RestController
public class RulesController {
    private final RuleDocumentService documentService;
    private final RulesAssistantService assistantService;
    private final SessionAccessService accessService;

    public RulesController(RuleDocumentService documentService, RulesAssistantService assistantService,
            SessionAccessService accessService) {
        this.documentService = documentService;
        this.assistantService = assistantService;
        this.accessService = accessService;
    }

    @GetMapping("/api/admin/games/{gameId}/rules")
    public AdminRules adminRules(@PathVariable Long gameId) {
        return documentService.adminView(gameId);
    }

    /** Uploads or replaces the manual; the answer is the new document, PROCESSING (or FAILED if AI is down). */
    @PostMapping("/api/admin/games/{gameId}/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public RuleDocumentResponse upload(@PathVariable Long gameId, @RequestParam("file") MultipartFile file,
            Principal principal) {
        return documentService.upload(gameId, file, principal.getName());
    }

    @DeleteMapping("/api/admin/games/{gameId}/rules")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long gameId) {
        documentService.remove(gameId);
    }

    @GetMapping("/api/participant/games/{gameId}/rules/status")
    public RulesStatus status(@PathVariable Long gameId,
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken) {
        accessService.authenticate(participantToken);
        return new RulesStatus(documentService.available(gameId));
    }

    @PostMapping("/api/participant/games/{gameId}/rules/ask")
    public AskResponse ask(@PathVariable Long gameId,
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken,
            @Valid @RequestBody AskRequest request) {
        return assistantService.ask(participantToken, gameId, request);
    }
}
