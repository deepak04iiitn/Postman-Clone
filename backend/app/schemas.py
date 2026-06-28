import json
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


# ---------------------------------------------------------------------------
# Helpers — coerce stored JSON strings → Python objects in Read schemas
# ---------------------------------------------------------------------------

def _parse_json_list(v: Any) -> list:
    if isinstance(v, str):
        return json.loads(v)
    return v


def _parse_json_dict(v: Any) -> dict:
    if isinstance(v, str):
        return json.loads(v)
    return v


# ---------------------------------------------------------------------------
# Shared key-value pair
# ---------------------------------------------------------------------------

class KeyValuePair(BaseModel):
    key: str
    value: str
    enabled: bool = True


# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------

class CollectionCreate(BaseModel):
    name: str
    description: str | None = None


class CollectionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class RequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    collection_id: str
    name: str
    method: str
    url: str
    headers: list[KeyValuePair]
    params: list[KeyValuePair]
    body_type: str
    body_content: str | None
    auth_type: str
    auth_config: dict
    created_at: datetime
    updated_at: datetime

    @field_validator("headers", "params", mode="before")
    @classmethod
    def parse_list(cls, v: Any) -> list:
        return _parse_json_list(v)

    @field_validator("auth_config", mode="before")
    @classmethod
    def parse_dict(cls, v: Any) -> dict:
        return _parse_json_dict(v)


class CollectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    requests: list[RequestRead] = []


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class RequestCreate(BaseModel):
    name: str
    method: str = "GET"
    url: str = ""
    headers: list[KeyValuePair] = []
    params: list[KeyValuePair] = []
    body_type: str = "none"
    body_content: str | None = None
    auth_type: str = "none"
    auth_config: dict = {}


class RequestUpdate(BaseModel):
    name: str | None = None
    method: str | None = None
    url: str | None = None
    headers: list[KeyValuePair] | None = None
    params: list[KeyValuePair] | None = None
    body_type: str | None = None
    body_content: str | None = None
    auth_type: str | None = None
    auth_config: dict | None = None


# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------

class EnvironmentCreate(BaseModel):
    name: str


class EnvironmentUpdate(BaseModel):
    name: str


class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Environment Variables
# ---------------------------------------------------------------------------

class EnvironmentVariableCreate(BaseModel):
    key: str
    value: str
    enabled: bool = True


class EnvironmentVariableRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    environment_id: str
    key: str
    value: str
    enabled: bool


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

class HistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    method: str
    url: str
    headers: list[KeyValuePair]
    params: list[KeyValuePair]
    body_type: str
    body_content: str | None
    auth_type: str
    auth_config: dict
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    response_headers: dict
    response_body: str | None
    error: str | None
    sent_at: datetime

    @field_validator("headers", "params", mode="before")
    @classmethod
    def parse_list(cls, v: Any) -> list:
        return _parse_json_list(v)

    @field_validator("auth_config", "response_headers", mode="before")
    @classmethod
    def parse_dict(cls, v: Any) -> dict:
        return _parse_json_dict(v)


class HistorySummary(BaseModel):
    """Lightweight shape returned by GET /api/history list."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    method: str
    url: str
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    error: str | None
    sent_at: datetime


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

class RunnerRequestIn(BaseModel):
    method: str
    url: str
    headers: list[KeyValuePair] = []
    params: list[KeyValuePair] = []
    body_type: str = "none"
    body_content: str | None = None
    auth_type: str = "none"
    auth_config: dict = {}


class RunnerResponseOut(BaseModel):
    status_code: int | None
    response_time_ms: int
    response_size_bytes: int
    headers: dict
    body: str | None
    error: str | None
