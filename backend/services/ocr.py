from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass
from typing import Optional, Tuple

from PIL import Image

LOGGER = logging.getLogger(__name__)

PIX2TEXT_ENABLED = os.getenv("AI_MARKING_ENABLE_PIX2TEXT", "1").lower() in {
    "1",
    "true",
}
PADDLE_ENABLED = os.getenv("AI_MARKING_ENABLE_PADDLE_OCR", "1").lower() in {
    "1",
    "true",
}


def _load_image(image_bytes: bytes) -> Image.Image:
    """Ensures the uploaded bytes are converted into a PIL image."""
    stream = io.BytesIO(image_bytes)
    return Image.open(stream).convert("RGB")


@dataclass
class Pix2TextResult:
    latex: str
    confidence: float


class Pix2TextService:
    """
    Thin wrapper around Pix2Text so we can gracefully degrade when the dependency
    is missing on the developer's machine.
    """

    def __init__(self) -> None:
        if not PIX2TEXT_ENABLED:
            LOGGER.info("Pix2Text disabled (set AI_MARKING_ENABLE_PIX2TEXT=1 to enable).")
            self._engine = None
            return

        try:
            from pix2text import Pix2Text  # type: ignore

            self._engine = Pix2Text()
            LOGGER.info("Pix2Text initialized.")
        except Exception as exc:  # pragma: no cover - best-effort import
            LOGGER.warning("Pix2Text unavailable, falling back to mock output: %s", exc)
            self._engine = None

    def extract_formula(self, image_bytes: bytes) -> Pix2TextResult:
        if self._engine is None:
            # Provide deterministic fallback for local development without GPU deps.
            return Pix2TextResult(latex="1 + x", confidence=0.0)

        image = _load_image(image_bytes)
        outputs = self._engine(image)  # type: ignore[misc]

        if isinstance(outputs, list) and outputs:
            best = max(outputs, key=lambda item: item.get("score", 0.0))
        elif isinstance(outputs, dict):
            best = outputs
        else:
            best = {"latex_str": "", "score": 0.0}

        latex = best.get("latex_str") or best.get("text", "")
        score = float(best.get("score", 0.0))
        return Pix2TextResult(latex=latex.strip(), confidence=max(min(score, 1.0), 0.0))


class PaddleOCRService:
    """
    Captures alphanumeric context with PaddleOCR so students can verify the result.
    """

    def __init__(self, lang: str = "en") -> None:
        if not PADDLE_ENABLED:
            LOGGER.info("PaddleOCR disabled (set AI_MARKING_ENABLE_PADDLE_OCR=1 to enable).")
            self._engine = None
            return

        try:
            from paddleocr import PaddleOCR  # type: ignore

            self._engine = PaddleOCR(lang=lang, use_angle_cls=True, show_log=False)
            LOGGER.info("PaddleOCR initialized.")
        except Exception as exc:  # pragma: no cover - best-effort import
            LOGGER.warning("PaddleOCR unavailable, falling back to mock output: %s", exc)
            self._engine = None

    def extract_text(self, image_bytes: bytes) -> Tuple[str, float]:
        if self._engine is None:
            return "unavailable (install paddleocr for full pipeline)", 0.0

        # PaddleOCR accepts numpy arrays.
        import numpy as np  # Local import to avoid dependency for other tasks.

        image = np.array(_load_image(image_bytes))
        ocr_result = self._engine.ocr(image, cls=True)

        texts = []
        confidences = []
        for block in ocr_result:
            for line in block:
                txt, score = line[1]
                texts.append(txt)
                confidences.append(score)

        aggregated_text = " ".join(texts).strip()
        confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0
        return aggregated_text, max(min(confidence, 1.0), 0.0)


class OCRPipeline:
    """
    Orchestrates Pix2Text and PaddleOCR to build the JSON contract expected by the UI.
    """

    def __init__(
        self,
        formula_engine: Optional[Pix2TextService] = None,
        text_engine: Optional[PaddleOCRService] = None,
    ) -> None:
        self.formula_engine = formula_engine or Pix2TextService()
        self.text_engine = text_engine or PaddleOCRService()

    async def analyze(self, image_bytes: bytes) -> dict:
        formula = self.formula_engine.extract_formula(image_bytes)
        text, text_confidence = self.text_engine.extract_text(image_bytes)

        result_type = "formula" if formula.latex else "text"
        confidence = max(formula.confidence, text_confidence)

        return {
            "type": result_type,
            "latex": formula.latex,
            "raw_text": text,
            "confidence": confidence,
        }
