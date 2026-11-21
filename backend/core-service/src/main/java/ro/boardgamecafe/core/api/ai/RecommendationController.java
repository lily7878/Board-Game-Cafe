package ro.boardgamecafe.core.api.ai;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationRequest;
import ro.boardgamecafe.core.api.ai.dto.RecommendationDtos.RecommendationResponse;
import ro.boardgamecafe.core.service.RecommendationService;

@RestController
@RequestMapping("/api/participant")
public class RecommendationController {
    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    /** Never 503: when the AI Service is down or slow the answer is the labelled FALLBACK list. */
    @PostMapping("/recommendations")
    public RecommendationResponse recommend(
            @RequestHeader(value = "X-Participant-Token", required = false) String participantToken,
            @Valid @RequestBody RecommendationRequest request) {
        return service.recommend(participantToken, request);
    }
}
