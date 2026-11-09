package ro.boardgamecafe.core.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.table.SessionParticipant;

public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, Long> {
    Optional<SessionParticipant> findByAccessTokenHash(String accessTokenHash);
}
