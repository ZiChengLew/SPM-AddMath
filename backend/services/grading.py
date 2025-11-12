from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional, Tuple

LOGGER = logging.getLogger(__name__)

try:  # SymPy is an optional dependency for the web app, so import lazily.
    import sympy as sp
    from sympy.parsing.latex import parse_latex
except Exception as exc:  # pragma: no cover - optional dependency
    LOGGER.warning("SymPy unavailable, grading will return mocked values: %s", exc)
    sp = None  # type: ignore
    parse_latex = None  # type: ignore


@dataclass
class NormalizedPair:
    student: Optional[str]
    answer: Optional[str]


class SympyGrader:
    """
    Handles LaTeX → SymPy normalization and structural equivalence checks.
    """

    def __init__(self) -> None:
        self.available = bool(sp and parse_latex)

    def _normalize_expr(self, latex: str):
        if not self.available:
            return None

        expr = parse_latex(latex)

        if isinstance(expr, sp.Equality):
            normalized = sp.simplify(expr.lhs - expr.rhs)
        else:
            normalized = sp.simplify(expr)

        return normalized

    def _serialize(self, expr) -> Optional[str]:
        if expr is None:
            return None
        return sp.latex(expr)

    def normalize(self, student_latex: str, answer_latex: str) -> NormalizedPair:
        student_expr = self._normalize_expr(student_latex)
        answer_expr = self._normalize_expr(answer_latex)
        return NormalizedPair(
            student=self._serialize(student_expr),
            answer=self._serialize(answer_expr),
        )

    def grade(self, student_latex: str, answer_latex: str) -> Tuple[bool, NormalizedPair, str]:
        if not self.available:
            reason = (
                "SymPy is not installed. Install sympy to enable structural grading."
            )
            normalized = NormalizedPair(student=None, answer=None)
            return False, normalized, reason

        student_expr = self._normalize_expr(student_latex)
        answer_expr = self._normalize_expr(answer_latex)

        normalized = NormalizedPair(
            student=self._serialize(student_expr),
            answer=self._serialize(answer_expr),
        )

        if student_expr is None or answer_expr is None:
            return False, normalized, "Unable to parse one of the expressions."

        difference = sp.simplify(student_expr - answer_expr)
        equivalent = difference == 0

        if equivalent:
            reason = "Normalized expressions are symbolically identical."
        else:
            reason = "Expressions differ after SymPy simplification."

        return equivalent, normalized, reason
