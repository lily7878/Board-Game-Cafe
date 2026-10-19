package ro.boardgamecafe.core.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.repository.CafeTableRepository;

@Service
public class CafeTableService {
    private final CafeTableRepository cafeTableRepository;

    public CafeTableService(CafeTableRepository cafeTableRepository) {
        this.cafeTableRepository = cafeTableRepository;
    }

    public CafeTable createTable(Integer tableNumber, Integer capacity) {
        CafeTable newTable = new CafeTable(tableNumber, capacity);
        return cafeTableRepository.save(newTable);
    }

    public List<CafeTable> getAllTables() {
        return cafeTableRepository.findAll();
    }

    public Optional<CafeTable> getTableById(Long id) {
        return cafeTableRepository.findById(id);
    }
}
