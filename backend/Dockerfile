FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/pyproject.toml

RUN pip install --no-cache-dir uv && uv pip install --system .

COPY app /app/app

RUN mkdir -p /app/storage

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

