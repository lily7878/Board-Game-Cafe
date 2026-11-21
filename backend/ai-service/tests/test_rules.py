import json
import time

import httpx
import pytest
from fastapi.testclient import TestClient

from app.services.documents import chunk_pages, extract_pages
from tests.pdf_util import make_pdf

TOKEN = "test-internal-token-123456"
HEADERS = {"X-Internal-Token": TOKEN}
KEYWORDS = ["robber", "seven", "road", "city", "win", "points", "trade", "harbor"]

MANUAL = make_pdf([
    ["Setup", "Each player takes 5 settlements, 4 cities and 15 roads of one color.",
     "Place the board in the middle of the table and the robber on the desert."],
    ["Rolling a seven", "If anyone rolls a seven, nobody receives resources.",
     "Every player with more than 7 cards discards half of them. Then move the robber."],
    ["Winning", "The first player to reach 10 victory points on their turn wins the game.",
     "A city is worth 2 points, a settlement 1 point."],
])


def fake_vector(text: str) -> list[float]:
    lower = text.lower()
    return [0.05] + [float(lower.count(k)) for k in KEYWORDS]


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("BGC_AI_INTERNAL_TOKEN", TOKEN)
    monkeypatch.setenv("AI_DATA_DIR", str(tmp_path))
    from app.config import get_settings

    get_settings.cache_clear()
    from app.main import app
    from app.services.llm import LlmClient

    state = {"answer": None, "fail_embed": False, "chat_requests": []}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/embeddings"):
            if state["fail_embed"]:
                return httpx.Response(500)
            texts = json.loads(request.content)["input"]
            return httpx.Response(200, json={"data": [{"embedding": fake_vector(t)} for t in texts]})
        if request.url.path.endswith("/chat/completions"):
            state["chat_requests"].append(json.loads(request.content))
            return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(state["answer"])}}]})
        return httpx.Response(200, json={"data": []})

    with TestClient(app) as test_client:
        app.state.llm = LlmClient(get_settings(), transport=httpx.MockTransport(handler))
        yield test_client, state


def upload_and_wait(test_client, document_id: int, pdf: bytes) -> dict:
    response = test_client.post(f"/internal/documents/{document_id}", content=pdf,
                                headers={**HEADERS, "Content-Type": "application/pdf"})
    assert response.status_code == 202
    for _ in range(50):
        status = test_client.get(f"/internal/documents/{document_id}", headers=HEADERS).json()
        if status["status"] != "PROCESSING":
            return status
        time.sleep(0.05)
    raise AssertionError("still processing")


def test_chunks_keep_their_page():
    chunks = chunk_pages(extract_pages(MANUAL))
    assert {c.page for c in chunks} == {1, 2, 3}
    assert any("robber" in c.text and c.page == 2 for c in chunks)


def test_upload_indexes_the_manual(client):
    test_client, _ = client
    status = upload_and_wait(test_client, 7, MANUAL)
    assert status == {"documentId": 7, "status": "READY", "pageCount": 3, "failureReason": None}


def test_not_a_pdf_fails_with_reason(client):
    test_client, _ = client
    status = upload_and_wait(test_client, 8, b"definitely not a pdf")
    assert status["status"] == "FAILED"
    assert status["failureReason"] == "Fișierul nu este un PDF valid."


def test_embedding_failure_fails_the_document(client):
    test_client, state = client
    state["fail_embed"] = True
    assert upload_and_wait(test_client, 9, MANUAL)["status"] == "FAILED"


def test_answer_cites_a_retrieved_page(client):
    test_client, state = client
    upload_and_wait(test_client, 7, MANUAL)
    state["answer"] = {"found": True, "answer": "Nimeni nu primește resurse și mutați hoțul.", "pages": [2, 2, 99]}

    response = test_client.post("/internal/rules/answer", headers=HEADERS,
                                json={"documentId": 7, "question": "What happens when I roll a seven? robber"})

    body = response.json()
    assert response.status_code == 200
    assert body["found"] is True
    assert [c["page"] for c in body["citations"]] == [2]  # page 99 was never retrieved
    sent = json.loads(state["chat_requests"][-1]["messages"][1]["content"])
    assert {f["pagina"] for f in sent["fragmente"]} >= {2}


def test_answer_without_valid_citation_is_not_found(client):
    test_client, state = client
    upload_and_wait(test_client, 7, MANUAL)
    state["answer"] = {"found": True, "answer": "Câștigă cine vrea.", "pages": [42]}
    body = test_client.post("/internal/rules/answer", headers=HEADERS,
                            json={"documentId": 7, "question": "how many points to win"}).json()
    assert body == {"answer": "Manualul nu spune asta. Întrebați personalul.", "found": False, "citations": []}


def test_answer_needs_a_ready_document(client):
    test_client, _ = client
    response = test_client.post("/internal/rules/answer", headers=HEADERS, json={"documentId": 404, "question": "x"})
    assert response.status_code == 409


def test_delete_removes_the_index(client):
    test_client, _ = client
    upload_and_wait(test_client, 7, MANUAL)
    assert test_client.delete("/internal/documents/7", headers=HEADERS).status_code == 204
    assert test_client.get("/internal/documents/7", headers=HEADERS).status_code == 404
