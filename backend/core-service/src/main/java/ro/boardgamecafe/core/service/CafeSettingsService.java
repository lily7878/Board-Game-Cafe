package ro.boardgamecafe.core.service;

import java.util.List;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.settings.dto.CafeSettingsResponse;
import ro.boardgamecafe.core.api.settings.dto.OpeningHoursResponse;
import ro.boardgamecafe.core.api.settings.dto.UpdateCafeSettingsRequest;
import ro.boardgamecafe.core.api.settings.dto.UpdateOpeningHoursRequest;
import ro.boardgamecafe.core.domain.settings.CafeSettings;
import ro.boardgamecafe.core.domain.settings.OpeningHours;
import ro.boardgamecafe.core.repository.CafeSettingsRepository;
import ro.boardgamecafe.core.repository.OpeningHoursRepository;

/** Global cafe configuration and the informative weekly schedule. */
@Service
@Transactional(readOnly = true)
public class CafeSettingsService {
    private final CafeSettingsRepository settingsRepository;
    private final OpeningHoursRepository openingHoursRepository;

    public CafeSettingsService(CafeSettingsRepository settingsRepository,
            OpeningHoursRepository openingHoursRepository) {
        this.settingsRepository = settingsRepository;
        this.openingHoursRepository = openingHoursRepository;
    }

    /** The settings row used by other services (fee snapshot, delivered game limit). */
    public CafeSettings current() {
        return settingsRepository.findById(CafeSettings.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("Cafe settings are missing; migration V5 was not applied."));
    }

    public CafeSettingsResponse get() {
        return response(current());
    }

    @Transactional
    public CafeSettingsResponse update(UpdateCafeSettingsRequest request) {
        CafeSettings settings = current();
        settings.update(request.cafeName(), request.accessFeePrice(), request.maxDeliveredGamesPerTable());
        settingsRepository.flush();
        return response(settings);
    }

    public List<OpeningHoursResponse> openingHours() {
        return openingHoursRepository.findAllByOrderByDayOfWeekAsc().stream()
                .map(CafeSettingsService::response).toList();
    }

    @Transactional
    public OpeningHoursResponse updateOpeningHours(int dayOfWeek, UpdateOpeningHoursRequest request) {
        if (dayOfWeek < 1 || dayOfWeek > 7)
            throw new IllegalArgumentException("Day of week must be between 1 (Monday) and 7 (Sunday).");
        OpeningHours hours = openingHoursRepository.findByDayOfWeek(dayOfWeek)
                .orElseThrow(() -> new EntityNotFoundException("Opening hours not found for day: " + dayOfWeek));
        if (request.closed()) {
            if (request.openTime() != null || request.closeTime() != null)
                throw new IllegalArgumentException("A closed day cannot have opening or closing times.");
            hours.markClosed();
        } else {
            hours.open(request.openTime(), request.closeTime());
        }
        return response(hours);
    }

    private static CafeSettingsResponse response(CafeSettings settings) {
        return new CafeSettingsResponse(settings.getCafeName(), settings.getAccessFeePrice(),
                settings.getMaxDeliveredGamesPerTable(), settings.getUpdatedAt());
    }

    private static OpeningHoursResponse response(OpeningHours hours) {
        return new OpeningHoursResponse(hours.getDayOfWeek(), hours.isClosed(), hours.getOpenTime(),
                hours.getCloseTime());
    }
}
