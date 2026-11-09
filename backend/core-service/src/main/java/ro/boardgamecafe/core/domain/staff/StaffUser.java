package ro.boardgamecafe.core.domain.staff;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "staff_users")
public class StaffUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    @Column(nullable = false, length = 255)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private StaffRole role;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StaffUser() {}
    public StaffUser(String fullName, String email, String passwordHash, StaffRole role) {
        this.fullName = fullName.strip(); this.email = email.strip().toLowerCase(java.util.Locale.ROOT);
        this.passwordHash = passwordHash; this.role = role; this.active = true; this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public StaffRole getRole() { return role; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setActive(boolean active) { this.active = active; }
    public void changePasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
