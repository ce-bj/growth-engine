# -*- coding: utf-8 -*-
"""会话级生成摘要（GenerationBrief）状态 — 先澄清后生成门控。"""
from __future__ import annotations

import copy
import json
import os
import time
import uuid
from contextvars import ContextVar
from typing import Any

_session_id: ContextVar[str] = ContextVar("b2b_brief_session_id", default="")
_brief_by_session: dict[str, dict[str, Any]] = {}


def brief_gate_enabled() -> bool:
    """旧版摘要卡门控（默认关闭）。关键澄清卡由 Bridge 独立下发，不依赖此开关。"""
    raw = os.environ.get("ENABLE_GENERATION_BRIEF_GATE", "false").strip().lower()
    return raw not in ("0", "false", "no", "off")


def bind_brief_session(session_id: str) -> None:
    sid = (session_id or "default").strip() or "default"
    _session_id.set(sid)
    _brief_by_session.setdefault(sid, {})


def _current_session() -> str:
    return (_session_id.get() or "default").strip() or "default"


def get_generation_brief() -> dict[str, Any] | None:
    brief = _brief_by_session.get(_current_session())
    if isinstance(brief, dict) and brief.get("briefId"):
        return copy.deepcopy(brief)
    return None


def set_generation_brief(brief: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(brief, dict):
        return {}
    stored = copy.deepcopy(brief)
    if not stored.get("briefId"):
        stored["briefId"] = f"brief-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
    stored.setdefault("version", "1")
    stored.setdefault("updatedAt", time.time())
    _brief_by_session[_current_session()] = stored
    return copy.deepcopy(stored)


def clear_generation_brief() -> None:
    _brief_by_session.pop(_current_session(), None)


def hydrate_generation_brief(brief: dict[str, Any] | None) -> None:
    if not isinstance(brief, dict) or not brief.get("briefId"):
        return
    existing = _brief_by_session.get(_current_session())
    if existing and existing.get("briefId") == brief.get("briefId"):
        merged = {**existing, **copy.deepcopy(brief)}
        _brief_by_session[_current_session()] = merged
        return
    set_generation_brief(brief)


def confirm_generation_brief() -> dict[str, Any] | None:
    brief = get_generation_brief()
    if not brief:
        return None
    brief["status"] = "confirmed"
    brief["confirmedAt"] = time.time()
    return set_generation_brief(brief)


def is_brief_confirmed() -> bool:
    brief = _brief_by_session.get(_current_session())
    return isinstance(brief, dict) and brief.get("status") == "confirmed"


def _finalize_clarification_dimensions(merged: dict[str, Any]) -> None:
    clar = merged.get("clarification")
    if not isinstance(clar, dict):
        return
    dims = clar.get("dimensions")
    if not isinstance(dims, list):
        return
    for dim in dims:
        if not isinstance(dim, dict):
            continue
        if dim.get("answered") or dim.get("skipped"):
            continue
        if dim.get("value") or (dim.get("values") or []):
            dim["answered"] = True
            continue
        dim["skipped"] = True


def merge_client_brief(
    brief: dict[str, Any],
    *,
    client_action: str = "",
) -> dict[str, Any]:
    """合并前端回传的 brief；处理 client_action。"""
    action = (client_action or "").strip().lower()
    current = get_generation_brief() or {}
    merged = {**current, **copy.deepcopy(brief)}
    merged.setdefault("briefId", current.get("briefId") or brief.get("briefId"))
    merged.setdefault("version", "1")

    if action == "submit_clarification":
        _finalize_clarification_dimensions(merged)
        merged["status"] = "confirmed"
        merged["confirmedAt"] = time.time()
    elif action == "update_brief":
        merged["status"] = merged.get("status") or "awaiting_confirm"
        if merged.get("status") == "needs_clarification":
            merged["status"] = "awaiting_confirm"
    elif action == "confirm_generate":
        merged["status"] = "confirmed"
        merged["confirmedAt"] = time.time()
    elif action == "supplement_materials":
        merged["status"] = "needs_clarification"
        merged.pop("confirmedAt", None)

    return set_generation_brief(merged)


def format_brief_block() -> str:
    brief = get_generation_brief()
    if not brief:
        return ""

    status = brief.get("status", "")
    payload = {
        k: brief.get(k)
        for k in ("recognition", "clarification")
        if brief.get(k) is not None
    }

    if brief_gate_enabled():
        lines = [
            "【当前生成摘要（GenerationBrief）】",
            f"briefId: {brief.get('briefId')}",
            f"status: {status}",
        ]
        if status == "confirmed":
            lines.append(
                "用户已通过摘要卡确认生成（client_action=confirm_generate）。"
                "**允许**调用 generate_product_content(mode=create)。"
            )
        elif status == "needs_clarification":
            lines.append(
                "摘要处于「待澄清」：请引导用户完成关键澄清卡片，"
                "**禁止**调用 generate_product_content。"
            )
        elif status == "awaiting_confirm":
            lines.append(
                "摘要处于「待确认」：请展示**下方**生成摘要卡，等待用户点「确认生成」或补充资料。"
                "**禁止**调用 generate_product_content。"
            )
        else:
            lines.append("生成摘要未确认，**禁止**首发 generate_product_content。")

        selected = [
            t.get("label")
            for t in (brief.get("suggestedTopics") or [])
            if isinstance(t, dict) and t.get("selected")
        ]
        if selected:
            lines.append(f"用户勾选章节：{', '.join(selected[:12])}")

        full_payload = {
            k: brief.get(k)
            for k in (
                "recognition",
                "clarification",
                "generatableModules",
                "suggestedTopics",
                "gaps",
                "pageTemplateId",
            )
            if brief.get(k) is not None
        }
        blob = json.dumps(full_payload, ensure_ascii=False, indent=2)
        if len(blob) > 10000:
            blob = blob[:10000] + "\n…（摘要已截断）"
        lines.append(blob)
        return "\n".join(lines) + "\n\n"

    return ""


def export_brief_for_client() -> dict[str, Any] | None:
    return get_generation_brief()
