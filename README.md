# AI Reel Captioning and Intro Zoom Editor

Full stack app that turns a talking-head clip into a Reels-ready MP4 with:

- burned-in captions
- active word highlight timing
- fixed intro zoom
- async background processing
- guest mode and account history mode

## Why this project

Short form creators usually juggle multiple tools for captions, timing, and export settings.  
This app gives one pipeline from upload to downloadable reel.

Output target:

- 9:16 vertical
- 1080x1920
- MP4 with H.264 video + AAC audio
- caption placement suitable for social overlays

## Tech stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend API: FastAPI, SQLAlchemy
- Auth: optional account auth with JWT (email and password)
- Queue: Celery + Redis
- DB: PostgreSQL
- AI transcription: WhisperX
- Rendering: FFmpeg
- Storage: local filesystem with clear service boundaries for future object storage
- Runtime: Docker Compose for backend services

## Product behavior

### Guest mode

- no sign in required
- can upload, process, preview, and download
- projects tied to `guest_session_id`
- guest projects expire after 24 hours

### Signed-in mode

- email/password sign-up and sign-in
- saved project history
- guest projects can be attached after sign-in

### Processing states

- `queued`
- `processing`
- `completed`
- `failed`

Progress messages include stages such as `extracting audio`, `transcribing`, `generating captions`, `rendering video`.

## Repository layout

```text
frontend/
  app/
  components/
  lib/
  types/
backend/
  app/
    api/
    core/
    db/
    media/
    models/
    schemas/
    services/
    tasks/
docker-compose.yml
Makefile
```

## Architecture

```text
Browser (Next.js)
  -> FastAPI (/api/projects, /api/jobs, /api/auth)
  -> PostgreSQL (projects, jobs, transcripts, users)
  -> Redis (Celery broker/result backend)
  -> Celery worker (FFmpeg + WhisperX pipeline)
  -> Local storage (/backend/storage)
```

## Quick start

### 1. Prerequisites

- Docker Desktop running
- Node.js 20+ and npm

### 2. Start backend stack (API, worker, DB, Redis)

From repo root:

```bash
docker compose up postgres redis backend worker --build
```

After first build, you can run without rebuilding:

```bash
docker compose up postgres redis backend worker
```

### 3. Start frontend

In another terminal:

```bash
cd frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

### 4. Open app

- Frontend: `http://localhost:3000` (or the port Next.js prints)
- Backend health: `http://localhost:8000/health`

## Daily run commands

Start services:

```bash
docker compose up -d postgres redis backend worker
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Stop services:

```bash
docker compose down
```

## Endpoints

### API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `DELETE /api/auth/account`
- `POST /api/projects`
- `POST /api/projects/{id}/upload`
- `GET /api/projects`
- `GET /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `POST /api/projects/{id}/attach-guest`
- `GET /api/jobs/{job_id}`

### Static media

- `GET /storage/...` for original and processed files

## Data model

### users

- `id`
- `email`
- `name`
- `password_hash`
- `created_at`

### projects

- `id`
- `user_id` (nullable)
- `guest_session_id` (nullable)
- `title`
- `original_filename`
- `original_file_path`
- `processed_file_path` (nullable)
- `status`
- `created_at`
- `updated_at`
- `expires_at` (nullable)

Constraint: each project belongs to either `user_id` or `guest_session_id`.

### jobs

- `id`
- `project_id`
- `status`
- `progress_message`
- `error_message`
- `created_at`
- `updated_at`
- `completed_at`

### transcripts

- `id`
- `project_id`
- `full_text`
- `word_timestamps_json`
- `caption_segments_json`
- `created_at`

## Processing pipeline

1. Save uploaded source video.
2. Normalize to vertical reel target.
3. Extract audio with FFmpeg.
4. Run WhisperX for transcript and word timestamps.
5. Segment words into readable caption lines.
6. Build ASS subtitle timeline with active-word highlight.
7. Apply intro zoom (0-1s in, 1-2s out) and burn captions.
8. Export final MP4 and update project/job/transcript records.

## Environment configuration

### Root `.env` (optional)

Copy `.env.example` to `.env` to override service ports used by Docker Compose.

### Backend `.env` (optional outside Docker)

Copy `backend/.env.example` to `backend/.env`.

Important values:

- `DATABASE_URL`
- `REDIS_URL`
- `STORAGE_ROOT`
- `WHISPERX_MODEL`
- `FFMPEG_BIN`
- `FFPROBE_BIN`

### Frontend `.env.local`

Set:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Note: `frontend/.env.example` still contains old Clerk keys from early scaffolding and they are not used by the current auth implementation.

## Troubleshooting

### `docker.sock` not found

Docker Desktop is not running. Start Docker Desktop and retry.

### Port already in use

Stop the conflicting process or override ports in root `.env`:

```env
BACKEND_PORT=8010
POSTGRES_PORT=5433
REDIS_PORT=6380
```

Update frontend API URL accordingly.

### Jobs stuck on first transcription

First run may take longer due to WhisperX model download inside worker container.

### Upload completes but no rendered output

Check worker logs:

```bash
docker compose logs -f worker
```

## Local run without Docker (optional)

If you prefer local services for Postgres/Redis:

```bash
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
celery -A app.tasks.celery_app worker --loglevel=info
```

Then run frontend as usual.

## Current limitations

- single caption style
- no scene detection
- no face tracking
- no billing or teams
- local storage only for now

## Next hardening steps

- add Alembic migrations for schema evolution
- add integration tests for upload and ownership
- move media serving to signed URLs behind authenticated download routes
- add object storage provider (S3-compatible)
