package ro.boardgamecafe.core.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SessionCredentialsCipher {
    private final SecureRandom random = new SecureRandom();
    private final String configuredKey;

    public SessionCredentialsCipher(@Value("${BGC_SESSION_CREDENTIAL_KEY:}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    public String encrypt(String value) {
        try {
            byte[] nonce = new byte[12]; random.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(128, nonce));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return "v1:" + Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(nonce.length + ciphertext.length).put(nonce).put(ciphertext).array());
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Session credential encryption failed.", ex);
        }
    }

    public String decrypt(String encoded) {
        if (encoded == null || !encoded.startsWith("v1:"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session credentials cannot be previewed.");
        try {
            byte[] payload = Base64.getDecoder().decode(encoded.substring(3));
            if (payload.length < 29) throw new IllegalArgumentException("Invalid encrypted credential.");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, payload, 0, 12));
            return new String(cipher.doFinal(payload, 12, payload.length - 12), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Session credentials cannot be decrypted with the configured key.");
        }
    }

    private SecretKeySpec key() {
        try {
            byte[] bytes = Base64.getDecoder().decode(configuredKey);
            if (bytes.length == 32) return new SecretKeySpec(bytes, "AES");
        } catch (IllegalArgumentException ignored) {
            // A missing or malformed key prevents opening and previewing sessions.
        }
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "BGC_SESSION_CREDENTIAL_KEY must be a Base64-encoded 32-byte key.");
    }
}
