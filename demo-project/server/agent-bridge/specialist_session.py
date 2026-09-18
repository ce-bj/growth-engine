# -*- coding: utf-8 -*-
"""会话级子 Agent 托管态（Handoff）：进/出、transcript 回写。"""
from __future__ import annotations

import re
import time
import uuid
from typing import Any

_EXIT_RE = re.compile(
    r"(退出子?agent|退出诊断|结束诊断|回主助手|返回主助手|退出托管|结束托管)",
    re.IGNORECASE,
)

_SPECIALISTS: dict[str, dict[str, Any]] = {
    "metrics": {
        "id": "metrics",
        "name": "业务指标归因 Agent",
        "kind": "metrics_attribution_v2",
        "default_task_label": "增长诊断",
    },
}

_active: dict[str, dict[str, Any]] = {}


def specialist_meta(specialist_id: str) -> dict[str, Any] | None:
    return _SPECIALISTS.get((specialist_id or "").strip())


def get_active(session_id: str) -> dict[str, Any] | None:
    return _active.get(session_id or "default")


def is_exit_utterance(text: str) -> bool:
    return bool(_EXIT_RE.search((text or "").strip()))


def enter(
    session_id: str,
    *,
    specialist_id: str,
    task_label: str = "",
    instruction: str = "",
    seed_user_text: str = "",
) -> dict[str, Any]:
    meta = specialist_meta(specialist_id) or {
        "id": specialist_id,
        "name": specialist_id,
        "kind": specialist_id,
        "default_task_label": "专项任务",
    }
    sid = session_id or "default"
    handoff_id = f"H-{uuid.uuid4().hex[:10]}"
    record = {
        "handoff_id": handoff_id,
        "session_id": sid,
        "specialist_id": meta["id"],
        "specialist_name": meta["name"],
        "kind": meta["kind"],
        "task_label": (task_label or meta["default_task_label"]).strip()
        or meta["default_task_label"],
        "instruction": (instruction or "").strip(),
        "entered_at": time.time(),
        "messages": [],
        "artifacts": {},
    }
    if (seed_user_text or "").strip():
        record["messages"].append(
            {"role": "user", "text": seed_user_text.strip()[:8000]},
        )
    _active[sid] = record
    return dict(record)


def append_message(session_id: str, role: str, text: str) -> None:
    active = get_active(session_id)
    if not active:
        return
    cleaned = (text or "").strip()
    if not cleaned:
        return
    active["messages"].append({"role": role, "text": cleaned[:12000]})


def merge_artifacts(session_id: str, artifacts: dict[str, Any] | None) -> None:
    active = get_active(session_id)
    if not active or not artifacts:
        return
    bucket = active.setdefault("artifacts", {})
    for key, value in artifacts.items():
        if value is not None:
            bucket[key] = value


def build_exit_message(active: dict[str, Any], *, reason: str) -> str:
    name = active.get("specialist_name") or "子 Agent"
    task = active.get("task_label") or "专项任务"
    reason_note = {
        "user_close": "（你已关闭托管）",
        "user_say_exit": "（你已要求退出）",
        "specialist_done": "（子 Agent 已完成并归还）",
        "error": "（因异常结束托管）",
    }.get(reason, "")
    summary = (active.get("summary_for_supervisor") or "").strip()
    lines = [
        f"已退出「{name}」，停止「{task}」{reason_note}。我已接管，可继续问我或交代下一步。",
    ]
    if summary:
        lines.append(f"本轮要点：{summary[:400]}")
    return "\n".join(lines)


def exit(
    session_id: str,
    *,
    reason: str = "user_close",
    summary_for_supervisor: str = "",
) -> dict[str, Any] | None:
    sid = session_id or "default"
    active = _active.pop(sid, None)
    if not active:
        return None
    if summary_for_supervisor.strip():
        active["summary_for_supervisor"] = summary_for_supervisor.strip()[:800]
    elif not active.get("summary_for_supervisor"):
        # 从最后一条 specialist 回复抽一句标题/首行
        for msg in reversed(active.get("messages") or []):
            if msg.get("role") == "specialist" and msg.get("text"):
                first = str(msg["text"]).strip().splitlines()[0].strip()
                active["summary_for_supervisor"] = first[:120]
                break
    transcript = {
        "handoff_id": active.get("handoff_id"),
        "specialist": {
            "id": active.get("specialist_id"),
            "name": active.get("specialist_name"),
        },
        "task_label": active.get("task_label"),
        "exit_reason": reason,
        "messages": list(active.get("messages") or []),
        "artifacts": dict(active.get("artifacts") or {}),
        "summary_for_supervisor": active.get("summary_for_supervisor") or "",
        "exit_message": build_exit_message(active, reason=reason),
    }
    return transcript
