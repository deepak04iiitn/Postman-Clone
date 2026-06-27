import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    requests: Mapped[list["Request"]] = relationship(
        "Request", back_populates="collection", cascade="all, delete-orphan"
    )


class Request(Base):
    __tablename__ = "requests"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    collection_id: Mapped[str] = mapped_column(
        Text, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    method: Mapped[str] = mapped_column(Text, nullable=False, default="GET")
    url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    headers: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    params: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    body_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    body_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    auth_config: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    collection: Mapped["Collection"] = relationship("Collection", back_populates="requests")


class Environment(Base):
    __tablename__ = "environments"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    variables: Mapped[list["EnvironmentVariable"]] = relationship(
        "EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan"
    )


class EnvironmentVariable(Base):
    __tablename__ = "environment_variables"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    environment_id: Mapped[str] = mapped_column(
        Text, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False
    )
    key: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    environment: Mapped["Environment"] = relationship("Environment", back_populates="variables")


class History(Base):
    __tablename__ = "history"

    id: Mapped[str] = mapped_column(Text, primary_key=True, default=_uuid)
    method: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    headers: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    params: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    body_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    body_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_type: Mapped[str] = mapped_column(Text, nullable=False, default="none")
    auth_config: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_headers: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
