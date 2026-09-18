# -*- coding: utf-8 -*-
"""会话级子 Agent 复用（保留各自 context）。"""
from __future__ import annotations

import asyncio
from typing import Any, Callable

_lock = asyncio.Lock()
_registry: dict[str, Any] = {}


async def get_or_create_agent(
    *,
    kind: str,
    session_id: str,
    model_name: str | None,
    factory: Callable[[], Any],
) -> Any:
    key = f"{kind}::{session_id}::{(model_name or '').strip()}"
    async with _lock:
        if key not in _registry:
            agent = factory()
            try:
                agent.state.session_id = session_id
            except Exception:  # noqa: BLE001
                pass
            _registry[key] = agent
        return _registry[key]
