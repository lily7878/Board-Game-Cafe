package ro.boardgamecafe.core.service;

import ro.boardgamecafe.core.live.LiveEvents;

import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.TableSessionRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.domain.table.CafeTable;
import ro.boardgamecafe.core.exception.DuplicateTableNumberException;
import ro.boardgamecafe.core.repository.CafeTableRepository;

@Service
public class CafeTableService {
    private final LiveEvents events;
    private final CafeTableRepository cafeTableRepository;
    private final TableSessionRepository sessionRepository;

    public CafeTableService(CafeTableRepository cafeTableRepository, TableSessionRepository sessionRepository, LiveEvents events) {
        this.events = events;
        this.cafeTableRepository = cafeTableRepository;
        this.sessionRepository = sessionRepository;
    }

    public CafeTable createTable(Integer tableNumber, Integer capacity) {
        if(cafeTableRepository.existsByTableNumber(tableNumber)) {
            throw new DuplicateTableNumberException(tableNumber);
        }
        CafeTable newTable = new CafeTable(tableNumber, capacity);
        CafeTable saved = cafeTableRepository.save(newTable);
        events.staff("tables.changed", saved.getId(), null);
        return saved;
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
            events.staff("tables.changed", table.getId(), null);
            return Optional.of(table);
        }
        return Optional.empty();
    }

    /**
     * A table with an open session cannot be deactivated. The table row is locked, the same lock taken
     * when a session is opened, so the check cannot race with opening a session.
     */
    @Transactional
    public Optional<CafeTable> setTableActive(Long id, boolean active) {
        Optional<CafeTable> result = cafeTableRepository.findByIdForUpdate(id);
        if(result.isPresent()) {
            CafeTable table = result.get();
            if(active)
                table.activate();
            else {
                if (sessionRepository.existsByTableIdAndStatusNot(id, SessionStatus.CLOSED))
                    throw new ConflictException("The table has an open session. Deactivate it after the session closes.");
                table.deactivate();
            }
            events.staff("tables.changed", table.getId(), null);
            return Optional.of(table);
        }
        return Optional.empty();
    }
}
