from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_owner
from app.db.session import get_db
from app.schemas.project import AttachGuestRequest, ProjectCreateRequest, ProjectDetailResponse, ProjectListResponse, ProjectResponse
from app.services.projects import ProjectService
from app.services.ownership import RequestOwner
from app.tasks.video_tasks import process_project_video


router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    return ProjectService(db).create_project(payload.title, owner)


@router.post("/{project_id}/upload")
def upload_project_video(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    project, job = ProjectService(db).upload_project_video(project_id, file, owner)
    process_project_video.delay(project.id, job.id)
    return {"project": ProjectResponse.model_validate(project), "job_id": job.id}


@router.get("", response_model=ProjectListResponse)
def list_projects(
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    projects = ProjectService(db).list_projects(owner)
    return ProjectListResponse(items=[ProjectResponse.model_validate(project) for project in projects])


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    project = ProjectService(db).get_project(project_id, owner)
    return ProjectDetailResponse(
        **ProjectResponse.model_validate(project).model_dump(),
        transcript=project.transcript,
        latest_job=project.latest_job,
    )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    ProjectService(db).delete_project(project_id, owner)
    return {"deleted": True}


@router.post("/{project_id}/attach-guest")
def attach_guest_project(
    project_id: int,
    payload: AttachGuestRequest,
    db: Session = Depends(get_db),
    owner: RequestOwner = Depends(get_owner),
):
    attached_count = ProjectService(db).attach_guest_projects(payload.guest_session_id, owner)
    return {"project_id": project_id, "attached_count": attached_count}

