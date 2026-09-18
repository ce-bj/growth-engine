# -*- coding: utf-8 -*-
"""Bridge 注入本轮 UserMsg，供委托工具转发给子 Agent。"""
from __future__ import annotations

from contextvars import ContextVar
from typing import Any

_pending_user_msg: ContextVar[Any | None] = ContextVar(
    "ai_ops_pending_user_msg",
    default=None,
)
_pending_session_id: ContextVar[str] = ContextVar(
    "ai_ops_pending_session_id",
    default="default",
)
_pending_model: ContextVar[str | None] = ContextVar(
    "ai_ops_pending_model",
    default=None,
)


def bind_pending_turn(
    user_msg: Any,
    *,
    session_id: str,
    model_name: str | None = None,
) -> None:
    _pending_user_msg.set(user_msg)
    _pending_session_id.set(session_id or "default")
    _pending_model.set((model_name or "").strip() or None)


def reset_pending_turn() -> None:
    _pending_user_msg.set(None)
    _pending_session_id.set("default")
    _pending_model.set(None)


def get_pending_user_msg() -> Any | None:
    return _pending_user_msg.get()


def get_pending_session_id() -> str:
    return _pending_session_id.get() or "default"


def get_pending_model() -> str | None:
    return _pending_model.get()
