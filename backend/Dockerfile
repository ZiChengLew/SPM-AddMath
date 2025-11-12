FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for Pillow, PaddleOCR, and OpenCV.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt

RUN pip install --upgrade pip \
    && pip install paddlepaddle==2.6.1 -f https://www.paddlepaddle.org.cn/whl/cpu \
    && pip install torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r /tmp/requirements.txt

COPY backend /app/backend

ENV AI_MARKING_ENABLE_PIX2TEXT=1 \
    AI_MARKING_ENABLE_PADDLE_OCR=1

EXPOSE 8001

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
