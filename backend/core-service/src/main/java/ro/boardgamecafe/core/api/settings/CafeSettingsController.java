package ro.boardgamecafe.core.api.settings;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.settings.dto.*;
import ro.boardgamecafe.core.service.CafeSettingsService;

/** Reading is open to STAFF and MANAGER (the staff UI shows the current fee); changes are MANAGER only. */
@RestController
@RequestMapping("/api/admin")
public class CafeSettingsController {
    private final CafeSettingsService service;

    public CafeSettingsController(CafeSettingsService service) {
        this.service = service;
    }

    @GetMapping("/settings")
    public CafeSettingsResponse settings() {
        return service.get();
    }

    @PutMapping("/settings")
    public CafeSettingsResponse updateSettings(@Valid @RequestBody UpdateCafeSettingsRequest request) {
        return service.update(request);
    }

    @GetMapping("/opening-hours")
    public List<OpeningHoursResponse> openingHours() {
        return service.openingHours();
    }

    @PutMapping("/opening-hours/{dayOfWeek}")
    public OpeningHoursResponse updateOpeningHours(@PathVariable int dayOfWeek,
            @Valid @RequestBody UpdateOpeningHoursRequest request) {
        return service.updateOpeningHours(dayOfWeek, request);
    }
}
