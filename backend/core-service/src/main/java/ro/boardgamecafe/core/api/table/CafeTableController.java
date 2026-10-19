package ro.boardgamecafe.core.api.table;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import org.springframework.http.HttpStatus;

import jakarta.validation.Valid;
import ro.boardgamecafe.core.api.table.dto.CafeTableResponse;
import ro.boardgamecafe.core.api.table.dto.CreateCafeTableRequest;
import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.service.CafeTableService;

@RestController 
@RequestMapping("/api/admin/tables")
public class CafeTableController {
    private final CafeTableService cafeTableService;

    public CafeTableController(CafeTableService cafeTableService) {
        this.cafeTableService = cafeTableService;
    }

    private CafeTableResponse mapToResponse(CafeTable table) { // Helper method to map CafeTable entity to CafeTableResponse DTO
        return new CafeTableResponse(
            table.getId(),
            table.getTableNumber(),
            table.getCapacity(),
            table.getActive(),
            table.getCreatedAt()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CafeTableResponse createTable(@Valid @RequestBody CreateCafeTableRequest request) {
        CafeTable savedTable = cafeTableService.createTable(request.tableNumber(), request.capacity());
        return mapToResponse(savedTable);
    }

    @GetMapping
    public List<CafeTableResponse> getAllTables() {
        List<CafeTable> tables = cafeTableService.getAllTables();
        return tables.stream()
                     .map(this::mapToResponse)
                     .toList();
        
    }

    @GetMapping("/{id}")
    public CafeTableResponse getTableById(@PathVariable Long id) {
        return cafeTableService.getTableById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Table not found with id: " + id
                ));
    }
}
