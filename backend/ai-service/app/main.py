"""AI Service: internal, called only by Core (never by the browsers)."""

import asyncio
import hmac
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request, Response

from app.config import get_settings
from app.services.documents import DocumentStore, ingest
from app.services.llm import LlmClient, LlmError
from app.services.recommend import RecommendationRequest, RecommendationResponse, recommend
from app.services.rules import AnswerRequest, AnswerResponse, answer

MAX_PDF_BYTES = 20 * 1024 * 1024

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.llm = LlmClient(settings)
    app.state.store = DocumentStore(settings.data_dir / "rules.db")
    # In the background: the service answers /health right away while the model loads.
    warm_up = asyncio.create_task(app.state.llm.warm_up())
    yield
    warm_up.cancel()
    await app.state.llm.close()


app = FastAPI(title="Board Game Cafe AI Service", lifespan=lifespan, docs_url=None, redoc_url=None)


def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    expected = get_settings().internal_token
    if not x_internal_token or not hmac.compare_digest(x_internal_token.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Invalid internal token.")


def llm(request: Request) -> LlmClient:
    return request.app.state.llm


def store(request: Request) -> DocumentStore:
    return request.app.state.store


@app.get("/health")
async def health(client: LlmClient = Depends(llm)):
    settings = get_settings()
    try:
        models = await client.available_models()
    except httpx.HTTPError:
        return {"status": "DOWN", "reason": "Model server unreachable."}
    # Ollama lists tags as "name:tag"; "bge-m3" is "bge-m3:latest".
    def present(name: str) -> bool:
        return name in models or f"{name}:latest" in models

    missing = [m for m in (settings.llm_model, settings.embed_model) if not present(m)]
    return {"status": "UP" if not missing else "DEGRADED", "missingModels": missing}


@app.post(
    "/internal/recommendations",
    response_model=RecommendationResponse,
    dependencies=[Depends(require_internal_token)],
)
async def recommendations(body: RecommendationRequest, client: LlmClient = Depends(llm)):
    try:
        return await recommend(client, body)
    except LlmError:
        raise HTTPException(status_code=503, detail="Model unavailable.")


def _status_body(status) -> dict:
    return {"documentId": status.document_id, "status": status.status, "pageCount": status.page_count,
            "failureReason": status.failure_reason}


@app.post("/internal/documents/{document_id}", status_code=202, dependencies=[Depends(require_internal_token)])
async def upload_document(document_id: int, request: Request, background: BackgroundTasks,
                          documents: DocumentStore = Depends(store), client: LlmClient = Depends(llm)):
    """Body: the raw PDF (application/pdf). Indexing runs in the background; poll GET for the outcome."""
    pdf = await request.body()
    if not pdf or len(pdf) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF missing or too large.")
    documents.set_status(document_id, "PROCESSING")
    background.add_task(ingest, documents, client, document_id, pdf)
    return _status_body(documents.status(document_id))


@app.get("/internal/documents/{document_id}", dependencies=[Depends(require_internal_token)])
async def document_status(document_id: int, documents: DocumentStore = Depends(store)):
    status = documents.status(document_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Unknown document.")
    return _status_body(status)


@app.delete("/internal/documents/{document_id}", status_code=204, dependencies=[Depends(require_internal_token)])
async def delete_document(document_id: int, documents: DocumentStore = Depends(store)):
    documents.delete(document_id)
    return Response(status_code=204)


@app.post("/internal/rules/answer", response_model=AnswerResponse, dependencies=[Depends(require_internal_token)])
async def rules_answer(body: AnswerRequest, documents: DocumentStore = Depends(store),
                       client: LlmClient = Depends(llm)):
    status = documents.status(body.documentId)
    if status is None or status.status != "READY":
        raise HTTPException(status_code=409, detail="Document not ready.")
    try:
        return await answer(documents, client, body)
    except LlmError:
        raise HTTPException(status_code=503, detail="Model unavailable.")
