BACKEND_DIR=backend
FRONTEND_DIR=frontend

.PHONY: backend-install frontend-install dev-backend dev-worker dev-frontend lint-backend

backend-install:
	cd $(BACKEND_DIR) && uv sync

frontend-install:
	cd $(FRONTEND_DIR) && pnpm install

dev-backend:
	cd $(BACKEND_DIR) && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-worker:
	cd $(BACKEND_DIR) && uv run celery -A app.tasks.celery_app worker --loglevel=info

dev-frontend:
	cd $(FRONTEND_DIR) && pnpm dev

lint-backend:
	cd $(BACKEND_DIR) && uv run python -m compileall app

