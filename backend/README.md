# Backend: AI Marking API

FastAPI service that handles OCR (Pix2Text + PaddleOCR) and SymPy-based equivalence checks.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

You will also need the PaddleOCR runtime dependencies (see the [official docs](https://github.com/PaddlePaddle/PaddleOCR)).

## Run locally

```bash
uvicorn backend.main:app --reload --port 8001
```

The service exposes:

- `POST /api/recognize-answer` – accepts `multipart/form-data` with a single `image` file.
- `POST /api/grade-answer` – accepts JSON `{ "student_latex": "...", "answer_latex": "..." }`.

Deploy the backend anywhere you can run FastAPI + Python (Railway, Fly.io, EC2, etc.).

### OCR engines

Pix2Text and PaddleOCR are enabled by default. If you need to disable either (e.g., limited hardware), set the corresponding environment variables before launching the server:

```bash
AI_MARKING_ENABLE_PIX2TEXT=0 \
AI_MARKING_ENABLE_PADDLE_OCR=0 \
uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

## Run via Docker (recommended for OCR stability)

The repository ships with `backend/Dockerfile`, which bundles Python 3.10, PaddlePaddle, PaddleOCR, Pix2Text, and Torch in a Linux container so macOS dependency issues disappear.

```bash
# From the repo root
docker build -t ai-marking-backend -f backend/Dockerfile .
docker run --rm -p 8001:8001 ai-marking-backend
```

With the container running, point the frontend to `http://localhost:8001` via `NEXT_PUBLIC_AI_MARKING_API_BASE`. OCR is enabled automatically inside the container.
