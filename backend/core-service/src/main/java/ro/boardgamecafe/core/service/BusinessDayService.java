package ro.boardgamecafe.core.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.day.dto.BusinessDayResponse;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.exception.GameRequestConflictException;
import ro.boardgamecafe.core.repository.BusinessDayRepository;

/** Access to the simulated business day. End of Day will be added here. */
@Service
@Transactional(readOnly = true)
public class BusinessDayService {
    private final BusinessDayRepository repository;

    public BusinessDayService(BusinessDayRepository repository) {
        this.repository = repository;
    }

    public BusinessDayResponse current() {
        return response(repository.findOpen()
                .orElseThrow(() -> new GameRequestConflictException("No business day is currently open.")));
    }

    /**
     * Locks the open day inside the calling transaction. Opening a session uses it so that it cannot
     * race with End of Day. If End of Day has just finalized the day, the caller gets 409 and may retry.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public BusinessDay lockOpenDay() {
        return repository.findOpenForUpdate()
                .orElseThrow(() -> new GameRequestConflictException(
                        "No business day is open right now. Retry in a moment."));
    }

    public static BusinessDayResponse response(BusinessDay day) {
        return new BusinessDayResponse(day.getId(), day.getDayNumber(), day.getLabel(), day.getStatus(),
                day.getOpenedAt(), day.getFinalizedAt());
    }
}
