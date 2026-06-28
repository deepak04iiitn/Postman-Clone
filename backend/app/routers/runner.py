import base64
import json
import time
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/runner", tags=["runner"])

TIMEOUT_SECONDS = 30


def _build_headers(pairs: list[schemas.KeyValuePair], auth_type: str, auth_config: dict) -> dict:
    headers: dict[str, str] = {
        kv.key: kv.value for kv in pairs if kv.enabled and kv.key
    }

    # Only inject auth if the client has NOT already set an Authorization header.
    # The client resolves {{variables}} before sending, so we trust its value.
    already_has_auth = any(k.lower() == "authorization" for k in headers)
    if not already_has_auth:
        if auth_type == "bearer":
            token = auth_config.get("token", "")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        elif auth_type == "basic":
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            encoded = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {encoded}"

    return headers


def _build_params(pairs: list[schemas.KeyValuePair]) -> dict:
    return {kv.key: kv.value for kv in pairs if kv.enabled and kv.key}


def _build_body(body_type: str, body_content: str | None):
    """Return kwargs to pass directly to httpx.AsyncClient.request()."""
    if body_type == "none" or body_content is None:
        return {}
    if body_type == "raw":
        return {"content": body_content.encode()}
    if body_type == "form-data":
        pairs = json.loads(body_content) if isinstance(body_content, str) else body_content
        return {"data": {p["key"]: p["value"] for p in pairs if p.get("enabled") and p.get("key")}}
    if body_type == "urlencoded":
        pairs = json.loads(body_content) if isinstance(body_content, str) else body_content
        return {"data": {p["key"]: p["value"] for p in pairs if p.get("enabled") and p.get("key")}}
    return {}


def _save_history(db: Session, payload: schemas.RunnerRequestIn, result: schemas.RunnerResponseOut):
    entry = models.History(
        id=str(uuid.uuid4()),
        method=payload.method,
        url=payload.url,
        headers=json.dumps([kv.model_dump() for kv in payload.headers]),
        params=json.dumps([kv.model_dump() for kv in payload.params]),
        body_type=payload.body_type,
        body_content=payload.body_content,
        auth_type=payload.auth_type,
        auth_config=json.dumps(payload.auth_config),
        status_code=result.status_code,
        response_time_ms=result.response_time_ms,
        response_size_bytes=result.response_size_bytes,
        response_headers=json.dumps(result.headers),
        response_body=result.body,
        error=result.error,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()


@router.post("/send", response_model=schemas.RunnerResponseOut)
async def send_request(payload: schemas.RunnerRequestIn, db: Session = Depends(get_db)):
    headers = _build_headers(payload.headers, payload.auth_type, payload.auth_config)
    params = _build_params(payload.params)
    body_kwargs = _build_body(payload.body_type, payload.body_content)

    start = time.monotonic()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.request(
                method=payload.method,
                url=payload.url,
                headers=headers,
                params=params,
                **body_kwargs,
            )

        elapsed_ms = int((time.monotonic() - start) * 1000)
        body_bytes = response.content
        response_size = len(body_bytes)

        try:
            body_text = body_bytes.decode("utf-8")
        except UnicodeDecodeError:
            body_text = body_bytes.decode("latin-1")

        result = schemas.RunnerResponseOut(
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            response_size_bytes=response_size,
            headers=dict(response.headers),
            body=body_text,
            error=None,
        )

    except httpx.TimeoutException:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            headers={},
            body=None,
            error="Request timed out",
        )

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = schemas.RunnerResponseOut(
            status_code=None,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            headers={},
            body=None,
            error=str(exc),
        )

    _save_history(db, payload, result)
    return result
