package ro.boardgamecafe.core.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.exception.DuplicateTableNumberException;
import ro.boardgamecafe.core.repository.CafeTableRepository;

@Service
public class CafeTableService {
    private final CafeTableRepository cafeTableRepository;

    public CafeTableService(CafeTableRepository cafeTableRepository) {
        this.cafeTableRepository = cafeTableRepository;
    }

    public CafeTable createTable(Integer tableNumber, Integer capacity) {
        if(cafeTableRepository.existsByTableNumber(tableNumber)) {
            throw new DuplicateTableNumberException(tableNumber);
        }
        CafeTable newTable = new CafeTable(tableNumber, capacity);
        return cafeTableRepository.save(newTable);
    }

    public List<CafeTable> getAllTables() {
        return cafeTableRepository.findAll();
    }

    public Optional<CafeTable> getTableById(Long id) {
        return cafeTableRepository.findById(id);
    }

    @Transactional 
    public Optional<CafeTable> updateTable(Long id, Integer tableNumber, Integer capacity) {
        Optional<CafeTable> result = cafeTableRepository.findById(id);
        if (result.isPresent()) {
            CafeTable table = result.get();
            if (tableNumber != null) {
                if(cafeTableRepository.existsByTableNumberAndIdNot(tableNumber, id)) {
                    throw new DuplicateTableNumberException(tableNumber);
                }
                table.changeTableNumber(tableNumber);
            }
            if (capacity != null) {
                table.changeCapacity(capacity);
            }
            return Optional.of(table);
        }
        return Optional.empty();
    }

    @Transactional 
    public Optional<CafeTable> setTableActive(Long id, boolean active) {
        Optional<CafeTable> result = cafeTableRepository.findById(id);
        if(result.isPresent()) {
            CafeTable table = result.get();
            if(active)
                table.activate();
            else
                table.deactivate();
            return Optional.of(table);
        }
        return Optional.empty();
    }
}
