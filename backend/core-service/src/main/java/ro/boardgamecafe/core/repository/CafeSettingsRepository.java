package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.settings.CafeSettings;

public interface CafeSettingsRepository extends JpaRepository<CafeSettings, Long> {
}
