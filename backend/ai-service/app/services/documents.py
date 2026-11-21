"""Rule manuals: PDF text per page -> chunks that keep their page -> embeddings in a local SQLite index.

The index lives in the AI service only (Core never reads it). A manual of a few hundred pages is a few
hundred chunks, so a plain cosine scan in Python is fast enough and needs no vector database.
"""

import asyncio
import io
import logging
import math
import sqlite3
import threading
from array import array
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

from app.services.llm import LlmClient, LlmError

log = logging.getLogger(__name__)

MAX_PAGES = 200
CHUNK_CHARS = 900
CHUNK_OVERLAP = 150
EMBED_BATCH = 16


@dataclass
class Chunk:
    page: int
    text: str


@dataclass
class DocumentStatus:
    document_id: int
    status: str
    page_count: int | None
    failure_reason: str | None


class DocumentProcessingError(Exception):
    """A manual that cannot be indexed; the message is shown to the manager."""


def extract_pages(pdf_bytes: bytes) -> list[str]:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        if reader.is_encrypted:
            raise DocumentProcessingError("PDF-ul este protejat cu parolă.")
        if len(reader.pages) > MAX_PAGES:
            raise DocumentProcessingError(f"PDF-ul are peste {MAX_PAGES} de pagini.")
        return [(page.extract_text() or "") for page in reader.pages]
    except DocumentProcessingError:
        raise
    except Exception as ex:  # pypdf raises many types for damaged files
        raise DocumentProcessingError("Fișierul nu este un PDF valid.") from ex


def chunk_pages(pages: list[str]) -> list[Chunk]:
    """Splits each page on its own, so every chunk has exactly one source page."""
    chunks: list[Chunk] = []
    for number, text in enumerate(pages, start=1):
        clean = " ".join(text.split())
        start = 0
        while start < len(clean):
            end = min(len(clean), start + CHUNK_CHARS)
            if end < len(clean):  # prefer to cut at a sentence or word boundary
                cut = max(clean.rfind(". ", start, end), clean.rfind(" ", start, end))
                if cut > start + CHUNK_CHARS // 2:
                    end = cut + 1
            piece = clean[start:end].strip()
            if len(piece) >= 40:
                chunks.append(Chunk(page=number, text=piece))
            if end >= len(clean):
                break
            start = max(end - CHUNK_OVERLAP, start + 1)
    return chunks


def cosine(a: array, b: array) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


class DocumentStore:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY,
                status TEXT NOT NULL,
                page_count INTEGER,
                failure_reason TEXT,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS chunks (
                document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                page INTEGER NOT NULL,
                text TEXT NOT NULL,
                embedding BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
            """
        )
        # A restart interrupts processing; those documents can only be uploaded again.
        self._db.execute(
            "UPDATE documents SET status='FAILED', failure_reason=? WHERE status='PROCESSING'",
            ("Procesarea a fost întreruptă. Încarcă din nou manualul.",),
        )
        self._db.commit()

    def set_status(self, document_id: int, status: str, page_count: int | None = None,
                   failure_reason: str | None = None) -> None:
        with self._lock:
            self._db.execute(
                "INSERT INTO documents (id, status, page_count, failure_reason, updated_at) VALUES (?, ?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET status=excluded.status, page_count=excluded.page_count, "
                "failure_reason=excluded.failure_reason, updated_at=excluded.updated_at",
                (document_id, status, page_count, failure_reason, datetime.now(timezone.utc).isoformat()),
            )
            self._db.commit()

    def status(self, document_id: int) -> DocumentStatus | None:
        with self._lock:
            row = self._db.execute(
                "SELECT status, page_count, failure_reason FROM documents WHERE id=?", (document_id,)
            ).fetchone()
        return DocumentStatus(document_id, *row) if row else None

    def replace_chunks(self, document_id: int, chunks: list[Chunk], vectors: list[list[float]]) -> None:
        with self._lock:
            self._db.execute("DELETE FROM chunks WHERE document_id=?", (document_id,))
            self._db.executemany(
                "INSERT INTO chunks (document_id, page, text, embedding) VALUES (?, ?, ?, ?)",
                [(document_id, c.page, c.text, array("f", v).tobytes()) for c, v in zip(chunks, vectors)],
            )
            self._db.commit()

    def delete(self, document_id: int) -> None:
        with self._lock:
            self._db.execute("DELETE FROM chunks WHERE document_id=?", (document_id,))
            self._db.execute("DELETE FROM documents WHERE id=?", (document_id,))
            self._db.commit()

    def search(self, document_id: int, query_vector: list[float], limit: int) -> list[tuple[float, Chunk]]:
        with self._lock:
            rows = self._db.execute(
                "SELECT page, text, embedding FROM chunks WHERE document_id=?", (document_id,)
            ).fetchall()
        query = array("f", query_vector)
        scored = []
        for page, text, blob in rows:
            vector = array("f")
            vector.frombytes(blob)
            scored.append((cosine(query, vector), Chunk(page, text)))
        scored.sort(key=lambda item: item[0], reverse=True)
        return scored[:limit]


async def ingest(store: DocumentStore, llm: LlmClient, document_id: int, pdf_bytes: bytes) -> None:
    """Runs in the background after the upload was accepted; the outcome is read through status()."""
    try:
        pages = await asyncio.to_thread(extract_pages, pdf_bytes)  # CPU work, off the event loop
        chunks = chunk_pages(pages)
        if not chunks:
            raise DocumentProcessingError("PDF-ul nu conține text (poate e scanat ca imagine).")
        vectors: list[list[float]] = []
        for start in range(0, len(chunks), EMBED_BATCH):
            vectors.extend(await llm.embed([c.text for c in chunks[start:start + EMBED_BATCH]]))
        store.replace_chunks(document_id, chunks, vectors)
        store.set_status(document_id, "READY", page_count=len(pages))
        log.info("Document %s indexed: %s pages, %s chunks.", document_id, len(pages), len(chunks))
    except DocumentProcessingError as ex:
        store.set_status(document_id, "FAILED", failure_reason=str(ex))
    except LlmError:
        store.set_status(document_id, "FAILED", failure_reason="Modelul de embeddings nu a răspuns. Încearcă din nou.")
    except Exception:
        log.exception("Document %s failed.", document_id)
        store.set_status(document_id, "FAILED", failure_reason="Eroare neașteptată la procesare.")
