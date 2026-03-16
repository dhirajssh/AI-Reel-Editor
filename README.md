# AI Video Captioning Platform

Full-stack app that turns a talking-head video into a Reels-ready vertical MP4 with burned-in, word-highlighted captions and an intro zoom effect.

## 1. Project Title

**AI Video Captioning Platform**  
Create captioned 9:16 short-form videos automatically from a single upload.

## 2. Demo

- Live deployment: `https://<your-domain>` (replace with your deployed URL)
- Demo video/GIF: `docs/demo.gif` (add your recording path or hosted link)

## 3. Features

- Upload MP4, MOV, or WEBM clips
- Guest mode (no sign-in) with 24-hour project retention
- Account mode (email/password + JWT) with project history
- Async processing with queued/processing/completed/failed statuses
- WhisperX transcription with fallback ASR backend support
- Word-level highlighted captions rendered into output video
- Intro zoom effect (first 2 seconds)
- Final export as 1080x1920 MP4 (H.264 + AAC)
- Project dashboard, detail view, playback, and download

## 4. Architecture

- Frontend:
  - Next.js 15 app (`frontend/`)
  - Handles auth state, uploads, polling, and project UI
- Backend:
  - FastAPI service (`backend/app/`)
  - Exposes auth, projects, and jobs APIs
  - Stores metadata in PostgreSQL
  - Serves media from `/storage`
- Worker / processing pipeline:
  - Celery worker + Redis broker
  - Runs FFmpeg normalization/rendering and WhisperX transcription
  - Persists job progress and transcript data

## 5. Tech Stack

- Frontend:
  - Next.js 15
  - TypeScript
  - Tailwind CSS
- Backend:
  - FastAPI
  - SQLAlchemy
  - Celery
- Database:
  - PostgreSQL
- AI / media processing:
  - WhisperX
  - Transformers (fallback ASR path)
  - FFmpeg / ffprobe
- Infrastructure:
  - Docker + Docker Compose
  - Redis
  - Caddy reverse proxy (production compose stack)
  - AWS EC2 compatible deployment model

## 6. Processing Pipeline

1. User creates project and uploads video from frontend.
2. Backend stores original file under `storage/project_<id>/` and creates a queued job.
3. Celery worker picks up the job.
4. Worker normalizes video to vertical (1080x1920), extracts mono 16kHz audio.
5. WhisperX (or fallback ASR) returns transcript + word timestamps.
6. Caption segments are generated and written to an ASS subtitle file.
7. FFmpeg applies intro zoom + caption burn-in to render final MP4.
8. Backend updates job/project status and frontend polls to display progress + download link.

## 7. Setup / Installation

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Node.js 20+
- npm

### Run locally

```bash
# from repo root
docker compose up postgres redis backend worker --build
```

In a second terminal:

```bash
cd frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`

## 8. Environment Variables

### Root `.env` (docker-compose.yml)

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `REDIS_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`

### Backend `.env` (local backend-only runs)

- `DATABASE_URL`
- `REDIS_URL`
- `STORAGE_ROOT`
- `CORS_ORIGINS`
- `MAX_UPLOAD_SIZE_MB`
- `MAX_DURATION_SECONDS`
- `WHISPERX_MODEL`
- `ASR_BACKEND`
- `FFMPEG_BIN`
- `FFPROBE_BIN`

### Production `.env.prod` (docker-compose.prod.yml)

- `DOMAIN`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `MAX_UPLOAD_SIZE_MB`
- `MAX_DURATION_SECONDS`
- `WHISPERX_MODEL`
- `ASR_BACKEND`

## 9. Deployment

Current deployment model in this repo:

- `frontend`: Docker container in `docker-compose.prod.yml`
- `backend`: Docker container in `docker-compose.prod.yml`
- `worker`: Docker container in `docker-compose.prod.yml`
- `postgres`: Docker container (same host)
- `redis`: Docker container (same host)
- `caddy`: Reverse proxy container routing traffic to frontend/backend
- Host environment: single VPS/VM (for example AWS EC2) with shared Docker volumes

Production launch command:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```
