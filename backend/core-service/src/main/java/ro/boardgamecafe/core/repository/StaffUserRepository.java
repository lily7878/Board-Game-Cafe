package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;

public interface StaffUserRepository extends JpaRepository<StaffUser, Long> {
    Optional<StaffUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByRoleAndActiveTrue(StaffRole role);
    List<StaffUser> findAllByOrderByIdAsc();
}
