package ro.boardgamecafe.core.domain.game;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** A PDF rule manual of a game. Only an active document (READY, not removed) is used by the assistant. */
@Entity
@Table(name = "game_rule_documents")
public class RuleDocument {
    private static final int MAX_REASON = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", nullable = false)
    private Long gameId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "sha256", nullable = false, length = 64)
    @JdbcTypeCode(SqlTypes.CHAR) // CHAR(64) in V10; without this Hibernate's validation expects VARCHAR
    private String sha256;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RuleDocumentStatus status;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "uploaded_by_id", nullable = false)
    private Long uploadedById;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "removed_at")
    private Instant removedAt;

    @Version
    private long version;

    protected RuleDocument() {}

    public RuleDocument(Long gameId, String fileName, long sizeBytes, String sha256, String storagePath,
            Long uploadedById, Instant uploadedAt) {
        this.gameId = gameId;
        this.fileName = fileName;
        this.sizeBytes = sizeBytes;
        this.contentType = "application/pdf";
        this.sha256 = sha256;
        this.storagePath = storagePath;
        this.uploadedById = uploadedById;
        this.uploadedAt = uploadedAt;
        this.status = RuleDocumentStatus.PROCESSING;
    }

    public void markReady(int pageCount, Instant now) {
        if (status != RuleDocumentStatus.PROCESSING) return;
        this.status = RuleDocumentStatus.READY;
        this.pageCount = pageCount > 0 ? pageCount : null;
        this.processedAt = now;
    }

    public void markFailed(String reason, Instant now) {
        if (status != RuleDocumentStatus.PROCESSING) return;
        this.status = RuleDocumentStatus.FAILED;
        String text = reason == null || reason.isBlank() ? "Procesarea a eșuat." : reason.strip();
        this.failureReason = text.length() > MAX_REASON ? text.substring(0, MAX_REASON) : text;
        this.processedAt = now;
    }

    public void activate() {
        if (status != RuleDocumentStatus.READY || removedAt != null)
            throw new IllegalStateException("Only a READY, not removed document can be active.");
        this.active = true;
    }

    public void deactivate() { this.active = false; }

    public void remove(Instant now) {
        this.active = false;
        if (removedAt == null) this.removedAt = now;
    }

    public Long getId() { return id; }
    public Long getGameId() { return gameId; }
    public String getFileName() { return fileName; }
    public long getSizeBytes() { return sizeBytes; }
    public String getContentType() { return contentType; }
    public String getSha256() { return sha256; }
    public String getStoragePath() { return storagePath; }
    public RuleDocumentStatus getStatus() { return status; }
    public String getFailureReason() { return failureReason; }
    public Integer getPageCount() { return pageCount; }
    public boolean isActive() { return active; }
    public Long getUploadedById() { return uploadedById; }
    public Instant getUploadedAt() { return uploadedAt; }
    public Instant getProcessedAt() { return processedAt; }
    public Instant getRemovedAt() { return removedAt; }
}
