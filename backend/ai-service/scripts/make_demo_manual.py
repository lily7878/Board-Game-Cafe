"""Writes docs/demo-manuals/catan-demo-rules.pdf: a short demo rulebook (own wording) to try the rules assistant.

Run from backend/ai-service:  .venv\\Scripts\\python.exe -m scripts.make_demo_manual
"""

from pathlib import Path

from tests.pdf_util import make_pdf

PAGES = [
    [
        "CATAN - Demo Rulebook (Board Game Cafe)",
        "",
        "Overview",
        "Players are settlers on an island. They collect resources, build roads,",
        "settlements and cities, and race to 10 victory points.",
        "",
        "Components",
        "19 terrain hexes, 6 sea frames, 18 number tokens, 95 resource cards",
        "(brick, lumber, wool, grain, ore), 25 development cards and 1 robber.",
        "Each player has 5 settlements, 4 cities and 15 roads of one color.",
        "",
        "Setup",
        "Build the island with the terrain hexes and place a number token on each,",
        "except the desert. The robber starts on the desert.",
        "Each player places 2 settlements and 2 roads. The second settlement",
        "immediately gives one resource for every terrain hex next to it.",
    ],
    [
        "Turn Overview",
        "",
        "On your turn you do three things in this order:",
        "1. Roll both dice. Every hex with that number produces resources for all",
        "   players with a settlement (1 card) or a city (2 cards) on its corners.",
        "2. Trade with other players or with the bank.",
        "3. Build roads, settlements, cities or buy development cards.",
        "",
        "Trading",
        "You may trade resources with other players only during your own turn.",
        "With the bank you can always trade 4 identical resources for 1 of your choice.",
        "A settlement on a harbor improves this rate to 3:1, or 2:1 for one resource.",
        "",
        "Building costs",
        "Road: 1 brick + 1 lumber.",
        "Settlement: 1 brick + 1 lumber + 1 wool + 1 grain.",
        "City (upgrade of a settlement): 3 ore + 2 grain.",
        "Development card: 1 ore + 1 wool + 1 grain.",
        "Settlements must be at least two corners away from any other settlement.",
    ],
    [
        "Rolling a 7 and the Robber",
        "",
        "When a 7 is rolled, no hex produces resources.",
        "Every player holding more than 7 resource cards must discard half of them,",
        "rounded down.",
        "Then the player who rolled moves the robber to any other hex and steals",
        "1 random resource card from a player with a settlement or city on that hex.",
        "A hex with the robber does not produce resources until the robber leaves.",
        "",
        "Development cards",
        "Knight: move the robber and steal 1 card.",
        "Progress cards: Road Building, Year of Plenty and Monopoly.",
        "Victory Point cards stay hidden until you win.",
        "You may play only one development card per turn, and not on the turn you",
        "bought it (Victory Point cards excepted).",
    ],
    [
        "Winning the Game",
        "",
        "The first player who has 10 or more victory points on their own turn wins.",
        "",
        "Victory points",
        "Settlement: 1 point. City: 2 points.",
        "Longest Road (at least 5 connected roads): 2 points.",
        "Largest Army (at least 3 Knights played): 2 points.",
        "Each Victory Point development card: 1 point.",
        "",
        "Game length",
        "A game takes about 60 to 90 minutes with 3 or 4 players.",
    ],
]


def main() -> None:
    target = Path(__file__).resolve().parents[3] / "docs" / "demo-manuals" / "catan-demo-rules.pdf"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(make_pdf(PAGES))
    print(target)


if __name__ == "__main__":
    main()
