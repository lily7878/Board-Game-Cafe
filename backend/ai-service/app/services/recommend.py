"""Reorders and explains the games Core has already judged eligible. Never adds new ones."""

import json
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field

from app.services.llm import LlmClient

MAX_ITEMS = 5
MAX_EXPLANATION_CHARS = 300
_PROMPT = (Path(__file__).parent.parent / "prompts" / "recommendations_v1.txt").read_text(encoding="utf-8")

MOOD_TEXT = {
    "FUN": "distracție și râsete: jocuri de petrecere, cu reguli scurte",
    "RELAXED": "strategie relaxată: gândire, dar fără stres",
    "TEAM": "jucăm în echipă: jocuri cooperative, toți contra jocului",
    "SERIOUS": "competiție serioasă: jocuri lungi și grele",
}


class Mood(str, Enum):
    FUN = "FUN"
    RELAXED = "RELAXED"
    TEAM = "TEAM"
    SERIOUS = "SERIOUS"


class Answers(BaseModel):
    players: int = Field(ge=1, le=20)
    mood: Mood
    maxDurationMinutes: int | None = Field(default=None, ge=1)


class Candidate(BaseModel):
    id: int
    title: str = Field(max_length=150)
    categories: list[str] = Field(default_factory=list, max_length=20)
    minPlayers: int
    maxPlayers: int
    durationMinutes: int
    maxDurationMinutes: int | None = None
    difficulty: str
    description: str = Field(default="", max_length=600)


class RecommendationRequest(BaseModel):
    answers: Answers
    candidates: list[Candidate] = Field(min_length=1, max_length=40)


class RecommendationItem(BaseModel):
    gameId: int
    explanation: str


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]


def _user_message(request: RecommendationRequest) -> str:
    answers = request.answers
    time = f"cel mult {answers.maxDurationMinutes} minute" if answers.maxDurationMinutes else "toată seara"
    payload = {
        "preferinte": {
            "jucatori": answers.players,
            "atmosfera": MOOD_TEXT[answers.mood.value],
            "timp": time,
        },
        "candidati": [c.model_dump() for c in request.candidates],
    }
    return json.dumps(payload, ensure_ascii=False)


def sanitize(raw: dict, candidate_ids: set[int]) -> list[RecommendationItem]:
    """Keeps only known, non-duplicate ids with a non-empty explanation, at most MAX_ITEMS."""
    items: list[RecommendationItem] = []
    seen: set[int] = set()
    for entry in raw.get("items", []) if isinstance(raw.get("items"), list) else []:
        if not isinstance(entry, dict):
            continue
        try:
            game_id = int(entry.get("gameId"))
        except (TypeError, ValueError):
            continue
        explanation = str(entry.get("explanation") or "").strip()
        if game_id not in candidate_ids or game_id in seen or not explanation:
            continue
        seen.add(game_id)
        items.append(RecommendationItem(gameId=game_id, explanation=explanation[:MAX_EXPLANATION_CHARS]))
        if len(items) == MAX_ITEMS:
            break
    return items


async def recommend(llm: LlmClient, request: RecommendationRequest) -> RecommendationResponse:
    raw = await llm.chat_json(_PROMPT, _user_message(request))
    return RecommendationResponse(items=sanitize(raw, {c.id for c in request.candidates}))
