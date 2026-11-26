"""Writes docs/demo-manuals/<slug>-demo-rules.pdf for every game in demo_manuals_data, plus manifest.json.

The manifest maps each PDF to the game title; scripts\\upload-demo-manuals.ps1 uses it to upload the manuals.
Run from backend/ai-service:  .venv\\Scripts\\python.exe -m scripts.make_demo_manuals
"""

import json
import textwrap
from pathlib import Path

from scripts.demo_manuals_data import MANUALS
from tests.pdf_util import make_pdf

OUT_DIR = Path(__file__).resolve().parents[3] / "docs" / "demo-manuals"
WIDTH = 86  # characters per line at 11 pt Helvetica on A4 with the helper's margins
LINES_PER_PAGE = 52


def layout(text: str) -> list[str]:
    """Wraps one page of the mini-markup into printable lines."""
    lines: list[str] = []
    paragraph: list[str] = []

    def flush() -> None:
        if paragraph:
            lines.extend(textwrap.wrap(" ".join(paragraph), WIDTH))
            paragraph.clear()

    for raw in text.strip("\n").splitlines():
        line = raw.strip()
        if not line:
            flush()
            lines.append("")
        elif line.startswith("## "):
            flush()
            if lines and lines[-1] != "":
                lines.append("")
            lines.append(line[3:].upper())
        elif line.startswith("- ") or line[:2].rstrip(".").isdigit():
            flush()
            lines.extend(textwrap.wrap(line, WIDTH, subsequent_indent="   "))
        elif raw.startswith("   ") and lines:  # continuation of a bullet or numbered item
            flush()
            lines.extend(textwrap.wrap(line, WIDTH, initial_indent="   ", subsequent_indent="   "))
        else:
            paragraph.append(line)
    flush()
    return lines


def build(manual: dict) -> bytes:
    pages: list[list[str]] = []
    for number, text in enumerate(manual["pages"], start=1):
        lines = layout(text)
        if number == 1:
            lines = [f"{manual['title'].upper()} - Demo Rulebook (Board Game Cafe)", ""] + lines
        while lines:  # a page too long for A4 continues on the next one
            pages.append(lines[:LINES_PER_PAGE])
            lines = lines[LINES_PER_PAGE:]
    return make_pdf(pages)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = [{"title": "Catan", "file": "catan-demo-rules.pdf"}]
    for manual in MANUALS:
        name = f"{manual['slug']}-demo-rules.pdf"
        (OUT_DIR / name).write_bytes(build(manual))
        manifest.append({"title": manual["title"], "file": name})
        print(f"{name}")
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(MANUALS)} manuals + manifest.json in {OUT_DIR}")


if __name__ == "__main__":
    main()
