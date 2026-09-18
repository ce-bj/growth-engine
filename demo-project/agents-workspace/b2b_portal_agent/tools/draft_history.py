# -*- coding: utf-8 -*-
"""会话级详情页草稿版本栈 — 支持回退/恢复上一版。"""
from __future__ import annotations

import copy
import hashlib
import json
import time
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

MAX_VERSIONS = 15

_session_id: ContextVar[str] = ContextVar("b2b_draft_session_id", default="")
_history_by_session: dict[str, list[DraftSnapshot]] = {}


@dataclass
class DraftSnapshot:
    version: int
    label: str
    source: str
    draft: dict[str, Any]
    created_at: float = field(default_factory=time.time)


def bind_draft_session(session_id: str) -> None:
    """Bridge 每轮对话开始前绑定会话 ID。"""
    sid = (session_id or "default").strip() or "default"
    _session_id.set(sid)
    _history_by_session.setdefault(sid, [])


def _current_session() -> str:
    return (_session_id.get() or "default").strip() or "default"


def _stack() -> list[DraftSnapshot]:
    return _history_by_session.setdefault(_current_session(), [])


def _fingerprint(draft: dict[str, Any]) -> str:
    slots = draft.get("slots") or {}
    raw = json.dumps(slots, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20]


def hydrate_draft_history(entries: list[dict[str, Any]] | None) -> None:
    """从前端同步版本栈（刷新后恢复）。"""
    if not entries:
        return
    stack = _stack()
    if stack:
        return
    for item in entries:
        draft = item.get("draft")
        if not isinstance(draft, dict) or not draft.get("slots"):
            continue
        ver = int(item.get("version") or len(stack) + 1)
        stack.append(
            DraftSnapshot(
                version=ver,
                label=str(item.get("label") or f"v{ver}"),
                source=str(item.get("source") or "sync"),
                draft=copy.deepcopy(draft),
                created_at=float(item.get("at") or item.get("created_at") or time.time()),
            ),
        )
    _renumber(stack)


def _renumber(stack: list[DraftSnapshot]) -> None:
    for idx, snap in enumerate(stack, start=1):
        snap.version = idx


def push_draft_version(
    draft: dict[str, Any],
    *,
    label: str = "",
    source: str = "agent",
    skip_if_unchanged: bool = True,
) -> int | None:
    """写入新版本；与栈顶相同则跳过。返回 version 或 None。"""
    if not isinstance(draft, dict) or not draft.get("slots"):
        return None
    stack = _stack()
    snap_draft = copy.deepcopy(draft)
    fp = _fingerprint(snap_draft)
    if skip_if_unchanged and stack and _fingerprint(stack[-1].draft) == fp:
        return stack[-1].version
    version = len(stack) + 1
    stack.append(
        DraftSnapshot(
            version=version,
            label=label or f"v{version}",
            source=source,
            draft=snap_draft,
        ),
    )
    if len(stack) > MAX_VERSIONS:
        del stack[0 : len(stack) - MAX_VERSIONS]
        _renumber(stack)
    return stack[-1].version


def list_draft_versions() -> list[dict[str, Any]]:
    stack = _stack()
    current = stack[-1].version if stack else None
    return [
        {
            "version": s.version,
            "label": s.label,
            "source": s.source,
            "is_current": s.version == current,
        }
        for s in stack
    ]


def get_draft_snapshot(version: int) -> DraftSnapshot | None:
    for snap in _stack():
        if snap.version == version:
            return snap
    return None


def resolve_restore_target(version: int = -1) -> DraftSnapshot | None:
    """``version=-1`` 表示上一版（当前版的前一快照）。"""
    stack = _stack()
    if len(stack) < 2:
        return None
    if version == -1:
        return stack[-2]
    for snap in stack:
        if snap.version == version:
            return snap
    return None


def format_history_block() -> str:
    versions = list_draft_versions()
    if not versions:
        return ""
    lines = [f"  - v{v['version']}: {v['label']} ({v['source']})" + (" ← 当前" if v.get("is_current") else "") for v in versions]
    return (
        "【草稿版本历史】\n"
        "用户说「回退/撤销/上一版」时，**必须**调用 `restore_page_draft(version=-1)`，"
        "**禁止**用 patch 或 generate(revise) 模拟撤销。\n"
        + "\n".join(lines)
        + "\n\n"
    )


def export_history_for_client() -> list[dict[str, Any]]:
    return [
        {
            "version": s.version,
            "label": s.label,
            "source": s.source,
            "at": s.created_at,
            "draft": copy.deepcopy(s.draft),
        }
        for s in _stack()
    ]
