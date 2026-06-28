"""
Idempotent seed script — populates demo data on first run.
Safe to call on every server restart; skips if data already exists.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Collection, Environment, EnvironmentVariable, History, Request


def _uuid() -> str:
    return str(uuid.uuid4())


def _now(offset_minutes: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=offset_minutes)


# ── Helpers ───────────────────────────────────────────────────────────────

def _req(db: Session, collection_id: str, **kwargs) -> Request:
    r = Request(
        id=_uuid(),
        collection_id=collection_id,
        headers=json.dumps(kwargs.pop("headers", [])),
        params=json.dumps(kwargs.pop("params", [])),
        auth_config=json.dumps(kwargs.pop("auth_config", {})),
        body_type=kwargs.pop("body_type", "none"),
        body_content=kwargs.pop("body_content", None),
        auth_type=kwargs.pop("auth_type", "none"),
        **kwargs,
    )
    db.add(r)
    return r


def _hist(db: Session, **kwargs) -> History:
    h = History(
        id=_uuid(),
        headers=json.dumps(kwargs.pop("headers", [])),
        params=json.dumps(kwargs.pop("params", [])),
        auth_config=json.dumps(kwargs.pop("auth_config", {})),
        response_headers=json.dumps(kwargs.pop("response_headers", {
            "content-type": "application/json; charset=utf-8",
        })),
        body_type=kwargs.pop("body_type", "none"),
        body_content=kwargs.pop("body_content", None),
        auth_type=kwargs.pop("auth_type", "none"),
        error=kwargs.pop("error", None),
        **kwargs,
    )
    db.add(h)
    return h


# ── Main seed function ────────────────────────────────────────────────────

def run_seed() -> None:
    db: Session = SessionLocal()
    try:
        # Idempotency check — skip if any collection already exists
        if db.query(Collection).first():
            return

        # ── Collections ───────────────────────────────────────

        # 1. JSONPlaceholder
        jp = Collection(id=_uuid(), name="JSONPlaceholder",
                        description="Sample REST requests against jsonplaceholder.typicode.com")
        db.add(jp)
        db.flush()

        _req(db, jp.id, name="Get all posts",     method="GET",
             url="https://jsonplaceholder.typicode.com/posts")
        _req(db, jp.id, name="Get post by ID",    method="GET",
             url="https://jsonplaceholder.typicode.com/posts/1")
        _req(db, jp.id, name="Create post",       method="POST",
             url="https://jsonplaceholder.typicode.com/posts",
             body_type="raw",
             body_content=json.dumps({
                 "title": "foo", "body": "bar", "userId": 1
             }, indent=2),
             headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}])
        _req(db, jp.id, name="Delete post",       method="DELETE",
             url="https://jsonplaceholder.typicode.com/posts/1")

        # 2. HTTPBin
        hb = Collection(id=_uuid(), name="HTTPBin",
                        description="Useful HTTP testing endpoints from httpbin.org")
        db.add(hb)
        db.flush()

        _req(db, hb.id, name="GET /get",          method="GET",
             url="https://httpbin.org/get",
             params=[{"key": "foo", "value": "bar", "enabled": True}])
        _req(db, hb.id, name="POST /post",        method="POST",
             url="https://httpbin.org/post",
             body_type="raw",
             body_content='{"message": "hello httpbin"}',
             headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}])
        _req(db, hb.id, name="GET /status/404",   method="GET",
             url="https://httpbin.org/status/404")

        # 3. ReqRes (uses {{baseUrl}} variable)
        rr = Collection(id=_uuid(), name="ReqRes",
                        description="ReqRes API using {{baseUrl}} environment variable")
        db.add(rr)
        db.flush()

        _req(db, rr.id, name="List users",        method="GET",
             url="{{baseUrl}}/users",
             params=[{"key": "page", "value": "1", "enabled": True}])
        _req(db, rr.id, name="Create user",       method="POST",
             url="{{baseUrl}}/users",
             body_type="raw",
             body_content=json.dumps({"name": "morpheus", "job": "leader"}, indent=2),
             headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}])

        # ── Environments ──────────────────────────────────────

        env_prod = Environment(id=_uuid(), name="ReqRes Production")
        db.add(env_prod)
        db.flush()

        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_prod.id,
            key="baseUrl", value="https://reqres.in/api", enabled=True,
        ))

        env_local = Environment(id=_uuid(), name="Local Dev")
        db.add(env_local)
        db.flush()

        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_local.id,
            key="baseUrl", value="http://localhost:3000/api", enabled=True,
        ))
        db.add(EnvironmentVariable(
            id=_uuid(), environment_id=env_local.id,
            key="authToken", value="dev-secret-token", enabled=True,
        ))

        # ── History ───────────────────────────────────────────

        jp_posts_body = json.dumps([
            {"userId": 1, "id": 1, "title": "sunt aut facere repellat", "body": "quia et suscipit"},
            {"userId": 1, "id": 2, "title": "qui est esse", "body": "est rerum tempore"},
        ])

        jp_post1_body = json.dumps({
            "userId": 1, "id": 1,
            "title": "sunt aut facere repellat provident occaecati excepturi optio",
            "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita",
        })

        jp_create_body = json.dumps({"id": 101, "title": "foo", "body": "bar", "userId": 1})

        hb_get_body = json.dumps({
            "args": {"foo": "bar"},
            "headers": {"Host": "httpbin.org", "User-Agent": "python-httpx/0.27.0"},
            "origin": "1.2.3.4",
            "url": "https://httpbin.org/get?foo=bar",
        })

        _hist(db,
              method="GET", url="https://jsonplaceholder.typicode.com/posts",
              status_code=200, response_time_ms=142, response_size_bytes=len(jp_posts_body),
              response_body=jp_posts_body,
              sent_at=_now(offset_minutes=2))

        _hist(db,
              method="GET", url="https://jsonplaceholder.typicode.com/posts/1",
              status_code=200, response_time_ms=89, response_size_bytes=len(jp_post1_body),
              response_body=jp_post1_body,
              sent_at=_now(offset_minutes=5))

        _hist(db,
              method="POST", url="https://jsonplaceholder.typicode.com/posts",
              body_type="raw",
              body_content='{"title":"foo","body":"bar","userId":1}',
              headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}],
              status_code=201, response_time_ms=230, response_size_bytes=len(jp_create_body),
              response_body=jp_create_body,
              response_headers={"content-type": "application/json; charset=utf-8", "location": "/posts/101"},
              sent_at=_now(offset_minutes=10))

        _hist(db,
              method="GET", url="https://httpbin.org/status/404",
              status_code=404, response_time_ms=310, response_size_bytes=0,
              response_body="",
              sent_at=_now(offset_minutes=15))

        _hist(db,
              method="GET", url="https://httpbin.org/get",
              params=[{"key": "foo", "value": "bar", "enabled": True}],
              status_code=200, response_time_ms=347, response_size_bytes=len(hb_get_body),
              response_body=hb_get_body,
              sent_at=_now(offset_minutes=20))

        db.commit()
        print("[seed] Demo data seeded successfully")

    except Exception as exc:
        db.rollback()
        print(f"[seed] Seed failed: {exc}")
    finally:
        db.close()
