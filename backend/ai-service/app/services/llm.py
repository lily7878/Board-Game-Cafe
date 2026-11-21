"""Client for an OpenAI-compatible model server (Ollama by default).

Only this module knows how the model is reached; switching to another provider
means changing LLM_BASE_URL / LLM_API_KEY / LLM_MODEL, not code.
"""

import json
import logging

import httpx

from app.config import Settings

log = logging.getLogger(__name__)


class LlmError(Exception):
    """The model could not be reached or did not return usable JSON."""


class LlmClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None):
        headers = {"Authorization": f"Bearer {settings.llm_api_key}"} if settings.llm_api_key else {}
        self._settings = settings
        self._http = httpx.AsyncClient(
            base_url=settings.llm_base_url.rstrip("/"),
            headers=headers,
            timeout=settings.llm_timeout_seconds,
            transport=transport,
        )

    async def close(self) -> None:
        await self._http.aclose()

    async def chat_json(self, system: str, user: str) -> dict:
        """Sends one chat turn and returns the model's answer parsed as a JSON object."""
        body = {
            "model": self._settings.llm_model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        try:
            response = await self._http.post("/chat/completions", json=body)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as ex:
            # The text of the answer is not logged: it may echo user input.
            log.warning("LLM call failed: %s", type(ex).__name__)
            raise LlmError(str(ex)) from ex
        if not isinstance(parsed, dict):
            raise LlmError("Model answer is not a JSON object.")
        return parsed

    async def warm_up(self) -> None:
        """Loads the chat model into memory so the first real request is not slowed by loading it."""
        try:
            await self._http.post("/chat/completions", json={
                "model": self._settings.llm_model,
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "ok"}],
            }, timeout=120)
            log.info("Model %s is loaded.", self._settings.llm_model)
        except httpx.HTTPError as ex:
            log.warning("Model warm-up failed: %s", type(ex).__name__)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embeddings for the rules assistant (bge-m3 by default)."""
        try:
            response = await self._http.post(
                "/embeddings", json={"model": self._settings.embed_model, "input": texts}
            )
            response.raise_for_status()
            return [item["embedding"] for item in response.json()["data"]]
        except (httpx.HTTPError, KeyError, ValueError) as ex:
            log.warning("Embedding call failed: %s", type(ex).__name__)
            raise LlmError(str(ex)) from ex

    async def available_models(self) -> set[str]:
        response = await self._http.get("/models")
        response.raise_for_status()
        return {item["id"] for item in response.json().get("data", [])}
