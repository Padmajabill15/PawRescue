"""Explainable severity scoring.

Score (0-100) = text evidence (max 60) + photo injury evidence (max 40) + emergency flag (15),
capped at 100. Every contribution is returned as a human-readable reason so NGOs can see
*why* a case was ranked, not just the label.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# (points, phrases). Phrases are regexes matched on word boundaries.
TEXT_RULES: list[tuple[int, str, list[str]]] = [
    (50, "life-threatening", [
        r"unconscious", r"not breathing", r"hit by (?:a |an )?(?:car|bus|truck|lorry|vehicle|bike|scooter|auto)",
        r"run over", r"electrocut\w*", r"seizures?", r"bleeding (?:heavily|a lot|profusely)", r"drowning",
        r"trapped", r"collapsed", r"paralys\w*",
    ]),
    (30, "serious injury", [
        r"bleed\w*", r"blood", r"fractur\w*", r"broken", r"wound\w*", r"accident", r"maggots?", r"burn\w*",
        r"poison\w*", r"attacked", r"bitten", r"can'?t (?:walk|stand|move)", r"cannot (?:walk|stand|move)", r"deep cut",
    ]),
    (15, "unwell", [
        r"sick", r"weak", r"limp\w*", r"injur\w*", r"hurt", r"stuck", r"abandon\w*", r"starv\w*", r"thin",
        r"infect\w*", r"skin disease", r"mange", r"vomit\w*", r"swollen", r"tick\w*",
    ]),
]

NEGATION = re.compile(r"\b(?:not|no|isn'?t|without|never)\s+(?:\w+\s+)?$")

LEVELS = [(70, "critical"), (45, "high"), (20, "medium"), (0, "low")]


@dataclass
class SeverityResult:
    level: str
    score: int
    reasons: list[str] = field(default_factory=list)


def _text_points(text: str) -> tuple[int, list[str]]:
    text = (text or "").lower()
    best = 0
    reasons: list[str] = []
    seen: set[str] = set()
    taken: list[tuple[int, int]] = []  # spans already explained by a stronger phrase
    for points, label, patterns in TEXT_RULES:
        for pat in patterns:
            for m in re.finditer(rf"\b{pat}\b", text):
                if NEGATION.search(text[max(0, m.start() - 20): m.start()]):
                    continue  # "not bleeding", "no wound"
                if any(a <= m.start() < b for a, b in taken):
                    continue  # "bleeding" inside "bleeding heavily"
                phrase = m.group(0)
                if phrase in seen:
                    continue
                taken.append(m.span())
                seen.add(phrase)
                best = max(best, points)
                reasons.append(f'Description mentions "{phrase}" ({label})')
    # Several independent signals add a little on top of the strongest one
    bonus = min(15, 8 * max(0, len(seen) - 1))
    return min(60, best + bonus), reasons[:4]


def score_severity(description: str, injury_probability: float | None, is_emergency: bool) -> SeverityResult:
    text_pts, reasons = _text_points(description)
    total = text_pts

    if injury_probability is not None:
        img_pts = round(40 * max(0.0, (injury_probability - 0.35) / 0.65))  # ignore weak signals
        if img_pts > 0:
            total += img_pts
            reasons.append(f"Photo looks injured or unwell ({round(injury_probability * 100)}% confidence)")
        elif injury_probability < 0.3:
            reasons.append("Photo shows no clear injury")

    if is_emergency:
        total += 15
        reasons.append("Reporter marked it as an emergency")

    total = max(0, min(100, total))
    if is_emergency:
        total = max(total, 45)  # an SOS is never ranked below "high"
    level = next(name for threshold, name in LEVELS if total >= threshold)
    if not reasons:
        reasons.append("No injury signals found in the text or photo")
    return SeverityResult(level=level, score=total, reasons=reasons)
