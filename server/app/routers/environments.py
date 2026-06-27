from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/environments", tags=["environments"])


@router.get("", response_model=list[schemas.EnvironmentRead])
def list_environments(db: Session = Depends(get_db)):
    return db.query(models.Environment).order_by(models.Environment.created_at).all()


@router.post("", response_model=schemas.EnvironmentRead, status_code=status.HTTP_201_CREATED)
def create_environment(body: schemas.EnvironmentCreate, db: Session = Depends(get_db)):
    env = models.Environment(name=body.name)
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.patch("/{env_id}", response_model=schemas.EnvironmentRead)
def rename_environment(
    env_id: str, body: schemas.EnvironmentUpdate, db: Session = Depends(get_db)
):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    env.name = body.name
    db.commit()
    db.refresh(env)
    return env


@router.delete("/{env_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment(env_id: str, db: Session = Depends(get_db)):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()


@router.get("/{env_id}/variables", response_model=list[schemas.EnvironmentVariableRead])
def get_variables(env_id: str, db: Session = Depends(get_db)):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env.variables


@router.put("/{env_id}/variables", response_model=list[schemas.EnvironmentVariableRead])
def replace_variables(
    env_id: str,
    body: list[schemas.EnvironmentVariableCreate],
    db: Session = Depends(get_db),
):
    env = db.get(models.Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    db.query(models.EnvironmentVariable).filter(
        models.EnvironmentVariable.environment_id == env_id
    ).delete()

    new_vars = [
        models.EnvironmentVariable(
            environment_id=env_id,
            key=v.key,
            value=v.value,
            enabled=v.enabled,
        )
        for v in body
    ]
    db.add_all(new_vars)
    db.commit()

    return (
        db.query(models.EnvironmentVariable)
        .filter(models.EnvironmentVariable.environment_id == env_id)
        .all()
    )
