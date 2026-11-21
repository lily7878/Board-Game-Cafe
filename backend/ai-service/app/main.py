"""AI Service: internal, called only by Core (never by the browsers)."""

import asyncio
import hmac
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request

from app.config import get_settings
from app.services.llm import LlmClient, LlmError
from app.services.recommend import RecommendationRequest, RecommendationResponse, recommend

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.llm = LlmClient(settings)
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
