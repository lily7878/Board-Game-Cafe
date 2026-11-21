import json

import httpx
import pytest
from fastapi.testclient import TestClient

TOKEN = "test-internal-token-123456"


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("BGC_AI_INTERNAL_TOKEN", TOKEN)
    monkeypatch.setenv("AI_DATA_DIR", str(tmp_path))
    from app.config import get_settings

    get_settings.cache_clear()
    from app.main import app
    from app.services.llm import LlmClient

    state = {"answer": None, "fail": False}

    def handler(request: httpx.Request) -> httpx.Response:
        if state["fail"]:
            return httpx.Response(500)
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json={"data": [{"id": get_settings().llm_model}, {"id": "bge-m3:latest"}]})
        content = json.dumps(state["answer"])
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})

    with TestClient(app) as test_client:
        app.state.llm = LlmClient(get_settings(), transport=httpx.MockTransport(handler))
        yield test_client, state


BODY = {
    "answers": {"players": 4, "mood": "TEAM", "maxDurationMinutes": 60},
    "candidates": [
        {"id": 1, "title": "Pandemic", "categories": ["Cooperativ"], "minPlayers": 2, "maxPlayers": 4,
         "durationMinutes": 45, "difficulty": "MEDIUM", "description": "Salvați lumea împreună."},
        {"id": 2, "title": "Dixit", "categories": ["Party"], "minPlayers": 3, "maxPlayers": 6,
         "durationMinutes": 30, "difficulty": "EASY", "description": "Povești și imagini."},
    ],
}


def test_rejects_missing_or_wrong_token(client):
    test_client, _ = client
    assert test_client.post("/internal/recommendations", json=BODY).status_code == 401
    wrong = {"X-Internal-Token": "wrong-token-wrong-token"}
    assert test_client.post("/internal/recommendations", json=BODY, headers=wrong).status_code == 401


def test_keeps_only_candidates_without_duplicates(client):
    test_client, state = client
    state["answer"] = {"items": [
        {"gameId": 1, "explanation": "Jucați împreună contra jocului."},
        {"gameId": 99, "explanation": "Inventat."},
        {"gameId": 1, "explanation": "Duplicat."},
        {"gameId": "2", "explanation": "  Râsete garantate.  "},
        {"gameId": 2, "explanation": ""},
    ]}
    response = test_client.post("/internal/recommendations", json=BODY, headers={"X-Internal-Token": TOKEN})
    assert response.status_code == 200
    assert response.json() == {"items": [
        {"gameId": 1, "explanation": "Jucați împreună contra jocului."},
        {"gameId": 2, "explanation": "Râsete garantate."},
    ]}


def test_model_down_returns_503(client):
    test_client, state = client
    state["fail"] = True
    response = test_client.post("/internal/recommendations", json=BODY, headers={"X-Internal-Token": TOKEN})
    assert response.status_code == 503


def test_health_reports_models(client):
    test_client, _ = client
    assert test_client.get("/health").json() == {"status": "UP", "missingModels": []}
