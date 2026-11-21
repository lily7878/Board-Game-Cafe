"""Answers a rules question only from the game's manual, with the pages it came from."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from app.services.documents import DocumentStore
from app.services.llm import LlmClient

TOP_CHUNKS = 5
MIN_SIMILARITY = 0.3
MAX_ANSWER_CHARS = 1200
EXCERPT_CHARS = 220
NOT_FOUND = "Manualul nu spune asta. Întrebați personalul."
_PROMPT = (Path(__file__).parent.parent / "prompts" / "rules_v1.txt").read_text(encoding="utf-8")


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=1500)


class AnswerRequest(BaseModel):
    documentId: int
    question: str = Field(min_length=1, max_length=300)
    history: list[Turn] = Field(default_factory=list, max_length=4)


class Citation(BaseModel):
    page: int
    excerpt: str


class AnswerResponse(BaseModel):
    answer: str
    found: bool
    citations: list[Citation]


def _not_found() -> AnswerResponse:
    return AnswerResponse(answer=NOT_FOUND, found=False, citations=[])


async def answer(store: DocumentStore, llm: LlmClient, request: AnswerRequest) -> AnswerResponse:
    # The follow-up question alone is often too short to search with ("și dacă sunt 2?"), so the last
    # user turn is added to the search text, but the model still answers only the new question.
    previous = [t.content for t in request.history if t.role == "user"][-1:]
    search_text = " ".join(previous + [request.question])
    query_vector = (await llm.embed([search_text]))[0]
    hits = [(score, chunk) for score, chunk in store.search(request.documentId, query_vector, TOP_CHUNKS)
            if score >= MIN_SIMILARITY]
    if not hits:
        return _not_found()

    excerpts = [{"pagina": chunk.page, "text": chunk.text} for _, chunk in hits]
    history = [{"rol": t.role, "text": t.content} for t in request.history]
    user = json.dumps({"fragmente": excerpts, "conversatie_anterioara": history, "intrebare": request.question},
                      ensure_ascii=False)
    raw = await llm.chat_json(_PROMPT, user)

    text = str(raw.get("answer") or "").strip()[:MAX_ANSWER_CHARS]
    raw_pages = raw.get("pages")
    pages: list[int] = []
    for value in raw_pages if isinstance(raw_pages, list) else []:
        try:
            pages.append(int(value))
        except (TypeError, ValueError):
            continue
    by_page = {}
    for _, chunk in hits:
        by_page.setdefault(chunk.page, chunk)
    cited = [p for p in dict.fromkeys(pages) if p in by_page]

    # An answer without a citation from the retrieved excerpts is not accepted.
    if raw.get("found") is not True or not text or not cited:
        return _not_found()
    return AnswerResponse(
        answer=text,
        found=True,
        citations=[Citation(page=p, excerpt=by_page[p].text[:EXCERPT_CHARS]) for p in sorted(cited)],
    )
