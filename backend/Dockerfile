FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  build-essential \
  patchelf \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/pyproject.toml

RUN pip install --no-cache-dir uv && uv pip install --system .

RUN python - <<'PY'
import glob
import site
import subprocess
from pathlib import Path

patterns = (
    "ctranslate2/*.so*",
    "ctranslate2.libs/libctranslate2*.so*",
    "**/libctranslate2*.so*",
)
targets: set[str] = set()
for base in site.getsitepackages():
    root = Path(base)
    for pattern in patterns:
        for match in glob.glob(str(root / pattern), recursive=True):
            targets.add(match)

for shared_object in sorted(targets):
    subprocess.run(["patchelf", "--clear-execstack", shared_object], check=False)
PY

COPY app /app/app

RUN mkdir -p /app/storage

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
