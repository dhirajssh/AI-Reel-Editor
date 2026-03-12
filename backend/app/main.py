from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.session import engine
from app.models import Job, Project, Transcript, User  # noqa: F401


configure_logging()
settings = get_settings()
Base.metadata.create_all(bind=engine)
Path(settings.storage_root).mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_prefix)
app.mount("/storage", StaticFiles(directory=settings.storage_root), name="storage")


@app.get("/health")
def health_check():
    return {"status": "ok"}
