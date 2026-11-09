package ro.boardgamecafe.core.service;

import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;
import ro.boardgamecafe.core.domain.game.GameCategory;
import ro.boardgamecafe.core.repository.GameCategoryRepository;
import ro.boardgamecafe.core.api.game.dto.GameCategoryRequest;
import ro.boardgamecafe.core.api.game.dto.GameCategoryResponse;
import ro.boardgamecafe.core.api.game.dto.UpdateGameCategoryRequest;

@Service
@Transactional(readOnly = true)
public class GameCategoryService {
    private final GameCategoryRepository repository;

    public GameCategoryService(GameCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public GameCategoryResponse create(ro.boardgamecafe.core.api.game.dto.CreateGameCategoryRequest request) {
        ensureUnique(request.name(), null);
        return response(repository.save(new GameCategory(request.name(), request.description(), true)));
    }

    public List<GameCategoryResponse> findAll() {
        return repository.findAll().stream().map(GameCategoryService::response).toList();
    }

    public GameCategoryResponse findById(Long id) {
        return response(find(id));
    }

    @Transactional
    public GameCategoryResponse update(Long id, UpdateGameCategoryRequest request) {
        GameCategory category = find(id);
        if (request.name() != null) {
            ensureUnique(request.name(), id);
            category.changeName(request.name());
        }
        if (request.description() != null)
            category.changeDescription(request.description());

        return response(category);
    }

    @Transactional
    public GameCategoryResponse setActive(Long id, boolean active) {
        GameCategory category = find(id);
        if (active)
            category.activate();
        else
            category.deactivate();

        return response(category);
    }

    private void ensureUnique(String name, Long id) {
        boolean duplicate = id == null ? repository.existsByNameIgnoreCase(name)
                : repository.existsByNameIgnoreCaseAndIdNot(name, id);
        if (duplicate)
            throw new DuplicateKeyException("A game category with this name already exists.");
    }

    private GameCategory find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Game category not found with id: " + id));
    }

    private static GameCategoryResponse response(GameCategory c) {
        return new GameCategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getActive());
    }
}
