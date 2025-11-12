from __future__ import annotations

import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .models import GradeRequest, GradeResponse, RecognitionResponse
from .services.grading import SympyGrader
from .services.ocr import OCRPipeline

LOGGER = logging.getLogger(__name__)

app = FastAPI(
    title="SPM Add Math AI Marking API",
    version="0.1.0",
    description="Uploads handwritten answers, performs OCR + grading, and returns explanations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_pipeline = OCRPipeline()
grader = SympyGrader()


@app.get("/healthz")
async def healthcheck():
    return {"status": "ok"}


@app.post(
    "/api/recognize-answer",
    response_model=RecognitionResponse,
    summary="Convert an uploaded answer image into LaTeX + plain text.",
)
async def recognize_answer(image: UploadFile = File(...)):
    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = await ocr_pipeline.analyze(contents)
    return RecognitionResponse(**result)


@app.post(
    "/api/grade-answer",
    response_model=GradeResponse,
    summary="Compare the confirmed LaTeX against the official answer.",
)
async def grade_answer(payload: GradeRequest):
    correct, normalized, reason = grader.grade(
        payload.student_latex, payload.answer_latex
    )
    return GradeResponse(
        correct=correct,
        reason=reason,
        normalized_student=normalized.student,
        normalized_answer=normalized.answer,
    )

