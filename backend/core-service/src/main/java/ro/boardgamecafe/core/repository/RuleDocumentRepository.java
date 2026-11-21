package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.game.RuleDocument;
import ro.boardgamecafe.core.domain.game.RuleDocumentStatus;

public interface RuleDocumentRepository extends JpaRepository<RuleDocument, Long> {
    Optional<RuleDocument> findByGameIdAndActiveTrue(Long gameId);

    boolean existsByGameIdAndActiveTrue(Long gameId);

    Optional<RuleDocument> findFirstByGameIdAndRemovedAtIsNullOrderByUploadedAtDescIdDesc(Long gameId);

    List<RuleDocument> findByGameIdAndRemovedAtIsNull(Long gameId);

    List<RuleDocument> findByStatus(RuleDocumentStatus status);
}
