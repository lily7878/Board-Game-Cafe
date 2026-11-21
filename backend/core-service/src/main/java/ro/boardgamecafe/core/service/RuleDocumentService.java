package ro.boardgamecafe.core.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.AdminRules;
import ro.boardgamecafe.core.api.ai.dto.RulesDtos.RuleDocumentResponse;
import ro.boardgamecafe.core.domain.game.RuleDocument;
import ro.boardgamecafe.core.domain.game.RuleDocumentStatus;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.integration.ai.AiServiceClient;
import ro.boardgamecafe.core.integration.ai.AiServiceClient.DocumentState;
import ro.boardgamecafe.core.repository.GameRepository;
import ro.boardgamecafe.core.repository.RuleDocumentRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;

/**
 * Upload, state and replacement of PDF rule manuals. Core keeps the file and the state; the AI Service indexes the
 * text. Processing is asynchronous: Core polls the AI Service every few seconds while documents are PROCESSING.
 */
@Service
public class RuleDocumentService {
    private static final Logger log = LoggerFactory.getLogger(RuleDocumentService.class);
    static final long MAX_BYTES = 20L * 1024 * 1024;
    private static final Duration PROCESSING_LIMIT = Duration.ofMinutes(15);
    private static final byte[] PDF_MAGIC = "%PDF-".getBytes();

    private final RuleDocumentRepository repository;
    private final GameRepository gameRepository;
    private final StaffUserRepository staffRepository;
    private final AiServiceClient aiClient;
    private final TransactionTemplate tx;
    private final Path storageDir;

    public RuleDocumentService(RuleDocumentRepository repository, GameRepository gameRepository,
            StaffUserRepository staffRepository, AiServiceClient aiClient, TransactionTemplate tx,
            @Value("${bgc.rules.storage-dir}") String storageDir) {
        this.repository = repository;
        this.gameRepository = gameRepository;
        this.staffRepository = staffRepository;
        this.aiClient = aiClient;
        this.tx = tx;
        this.storageDir = Path.of(storageDir).toAbsolutePath().normalize();
    }

    public AdminRules adminView(Long gameId) {
        return tx.execute(status -> {
            requireGame(gameId);
            RuleDocumentResponse latest = repository.findFirstByGameIdAndRemovedAtIsNullOrderByUploadedAtDescIdDesc(gameId)
                    .map(this::toResponse).orElse(null);
            return new AdminRules(repository.existsByGameIdAndActiveTrue(gameId), latest);
        });
    }

    public boolean available(Long gameId) {
        return repository.existsByGameIdAndActiveTrue(gameId);
    }

    public RuleDocumentResponse upload(Long gameId, MultipartFile file, String staffEmail) {
        byte[] bytes = validatedBytes(file);
        String sha256 = sha256(bytes);
        String fileName = cleanFileName(file.getOriginalFilename());

        Path target = storageDir.resolve(Long.toString(gameId)).resolve(UUID.randomUUID() + ".pdf");
        RuleDocument saved;
        try {
            saved = tx.execute(status -> {
                requireGame(gameId);
                StaffUser staff = staffRepository.findByEmailIgnoreCase(staffEmail)
                        .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
                repository.findFirstByGameIdAndRemovedAtIsNullOrderByUploadedAtDescIdDesc(gameId)
                        .filter(latest -> latest.getSha256().equals(sha256) && latest.getStatus() != RuleDocumentStatus.FAILED)
                        .ifPresent(latest -> { throw new ConflictException("Acest manual este deja încărcat."); });
                if (repository.findByGameIdAndRemovedAtIsNull(gameId).stream()
                        .anyMatch(doc -> doc.getStatus() == RuleDocumentStatus.PROCESSING))
                    throw new ConflictException("Un manual pentru acest joc este încă în procesare.");
                write(target, bytes);
                return repository.save(new RuleDocument(gameId, fileName, bytes.length, sha256,
                        storageDir.relativize(target).toString(), staff.getId(), Instant.now()));
            });
        } catch (RuntimeException ex) {
            deleteQuietly(target);
            throw ex;
        }

        // Outside the transaction: the AI call may take a moment and must not hold a DB connection.
        if (!aiClient.submitDocument(saved.getId(), bytes)) {
            fail(saved.getId(), aiClient.enabled()
                    ? "Serviciul AI nu răspunde. Pornește-l și încarcă din nou manualul."
                    : "Serviciul AI nu este configurat (lipsește BGC_AI_INTERNAL_TOKEN).");
        }
        return tx.execute(status -> toResponse(repository.findById(saved.getId()).orElseThrow()));
    }

    /** Removes the game's manual: the assistant becomes unavailable. Files stay on disk for audit. */
    public void remove(Long gameId) {
        List<Long> removed = tx.execute(status -> {
            requireGame(gameId);
            List<Long> ids = new ArrayList<>();
            for (RuleDocument doc : repository.findByGameIdAndRemovedAtIsNull(gameId)) {
                doc.remove(Instant.now());
                ids.add(doc.getId());
            }
            return ids;
        });
        removed.forEach(aiClient::deleteDocument);
    }

    @Scheduled(fixedDelayString = "${bgc.rules.poll-interval:5s}", initialDelayString = "${bgc.rules.poll-interval:5s}")
    public void pollProcessing() {
        for (RuleDocument doc : repository.findByStatus(RuleDocumentStatus.PROCESSING)) {
            try {
                poll(doc.getId(), doc.getUploadedAt());
            } catch (RuntimeException ex) {
                log.warn("Polling rule document {} failed: {}", doc.getId(), ex.toString());
            }
        }
    }

    void poll(Long documentId, Instant uploadedAt) {
        DocumentState state = aiClient.documentStatus(documentId);
        switch (state.kind()) {
            case FOUND -> {
                String status = state.status().status();
                if ("READY".equals(status)) {
                    Integer pages = state.status().pageCount();
                    ready(documentId, pages == null ? 0 : pages);
                } else if ("FAILED".equals(status)) {
                    fail(documentId, state.status().failureReason());
                }
            }
            case NOT_FOUND -> fail(documentId, "Procesarea s-a întrerupt. Încarcă din nou manualul.");
            case UNREACHABLE -> {
                if (uploadedAt.plus(PROCESSING_LIMIT).isBefore(Instant.now()))
                    fail(documentId, "Serviciul AI nu a terminat procesarea la timp. Încarcă din nou manualul.");
            }
        }
    }

    /** READY: the new manual becomes the active one; the previous one stops being used. */
    private void ready(Long documentId, int pageCount) {
        Long replaced = tx.execute(status -> {
            RuleDocument doc = repository.findById(documentId).orElseThrow();
            if (doc.getStatus() != RuleDocumentStatus.PROCESSING) return null;
            doc.markReady(pageCount, Instant.now());
            if (doc.getRemovedAt() != null) return doc.getId(); // removed while processing: drop its index
            Long previous = repository.findByGameIdAndActiveTrue(doc.getGameId()).map(old -> {
                old.deactivate();
                return old.getId();
            }).orElse(null);
            repository.flush(); // the old row must be inactive before the unique "one active per game" check
            doc.activate();
            return previous;
        });
        if (replaced != null) aiClient.deleteDocument(replaced);
    }

    private void fail(Long documentId, String reason) {
        tx.executeWithoutResult(status -> repository.findById(documentId)
                .ifPresent(doc -> doc.markFailed(reason, Instant.now())));
    }

    private void requireGame(Long gameId) {
        if (!gameRepository.existsById(gameId)) throw new EntityNotFoundException("Game not found with id: " + gameId);
    }

    private RuleDocumentResponse toResponse(RuleDocument doc) {
        String uploadedBy = staffRepository.findById(doc.getUploadedById()).map(StaffUser::getFullName).orElse(null);
        return new RuleDocumentResponse(doc.getId(), doc.getFileName(), doc.getSizeBytes(), doc.getPageCount(),
                doc.getStatus(), doc.getFailureReason(), doc.isActive(), doc.getUploadedAt(), uploadedBy,
                doc.getProcessedAt());
    }

    static byte[] validatedBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Alege un fișier PDF.");
        if (file.getSize() > MAX_BYTES)
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "PDF-ul poate avea cel mult 20 MB.");
        byte[] bytes;
        try (InputStream in = file.getInputStream()) {
            bytes = in.readAllBytes();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
        if (!startsWithPdfMagic(bytes))
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Fișierul trebuie să fie un PDF.");
        return bytes;
    }

    static boolean startsWithPdfMagic(byte[] bytes) {
        if (bytes.length < PDF_MAGIC.length) return false;
        for (int i = 0; i < PDF_MAGIC.length; i++) if (bytes[i] != PDF_MAGIC[i]) return false;
        return true;
    }

    static String cleanFileName(String original) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").strip();
        if (name.isEmpty()) name = "manual.pdf";
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static void write(Path target, byte[] bytes) {
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not store the PDF.", ex);
        }
    }

    private static void deleteQuietly(Path target) {
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // best effort: an orphan file is harmless
        }
    }
}
