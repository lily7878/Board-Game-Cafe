package ro.boardgamecafe.core.api.day;

import org.springframework.web.bind.annotation.*;
import ro.boardgamecafe.core.api.day.dto.BusinessDayResponse;
import ro.boardgamecafe.core.service.BusinessDayService;

@RestController
@RequestMapping("/api/admin/business-days")
public class BusinessDayController {
    private final BusinessDayService service;

    public BusinessDayController(BusinessDayService service) {
        this.service = service;
    }

    @GetMapping("/current")
    public BusinessDayResponse current() {
        return service.current();
    }
}
