# -*- coding: utf-8 -*-
"""会话轮次日志 — 落盘 JSONL，供排查问题与离线评估。"""
from __future__ import annotations

import json
import os
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEMO_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_LOG_DIR = DEMO_PROJECT_ROOT / "logs" / "chat-sessions"

MAX_FIELD_CHARS = int(os.environ.get("CHAT_SESSION_LOG_MAX_CHARS", "120000"))


def _enabled() -> bool:
    raw = os.environ.get("CHAT_SESSION_LOG_ENABLE", "true").strip().lower()
    return raw not in ("0", "false", "no", "off")


def _log_dir() -> Path:
    custom = os.environ.get("CHAT_SESSION_LOG_DIR", "").strip()
    return Path(custom) if custom else DEFAULT_LOG_DIR


def ensure_log_dirs() -> Path:
    """启动时预创建日志目录，避免用户未发消息前文件夹不存在。"""
    root = _log_dir()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_session_id(session_id: str) -> str:
    cleaned = re.sub(r"[^\w.\-]+", "_", session_id.strip())[:120]
    return cleaned or "unknown-session"


def _truncate(value: str, limit: int = MAX_FIELD_CHARS) -> str:
    if len(value) <= limit:
        return value
    return f"{value[:limit]}\n…[truncated {len(value) - limit} chars]"


def sanitize_chat_request(req: Any) -> dict[str, Any]:
    """请求摘要：不落盘 base64 图片正文。"""
    images: list[dict[str, Any]] = []
    for img in getattr(req, "images", []) or []:
        images.append(
            {
                "name": getattr(img, "name", None),
                "url": getattr(img, "url", None),
                "media_type": getattr(img, "media_type", None),
                "has_data": bool(getattr(img, "data", None)),
                "data_bytes": len(getattr(img, "data", "") or ""),
            },
        )
    message = getattr(req, "message", "") or ""
    conversation = list(getattr(req, "conversation", None) or [])
    return {
        "message": message,
        "message_preview": _truncate(message.replace("\n", " "), 200),
        "conversation_count": len(conversation),
        "image_urls": list(getattr(req, "image_urls", []) or []),
        "images": images,
        "session_id": getattr(req, "session_id", "") or "",
        "model": (getattr(req, "model", None) or "").strip(),
        "client_action": (getattr(req, "client_action", None) or "").strip(),
        "generation_brief_id": (getattr(req, "generation_brief", None) or {}).get("briefId")
        if isinstance(getattr(req, "generation_brief", None), dict)
        else None,
    }


class TurnRecorder:
    """收集单轮 SSE 事件，结束时写入 JSONL。"""

    def __init__(self, session_id: str, request: dict[str, Any]) -> None:
        self.session_id = _safe_session_id(session_id)
        self.turn_id = (
            f"turn-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}"
            f"-{uuid.uuid4().hex[:8]}"
        )
        self.started_at = time.perf_counter()
        self.request = request
        self.assistant_text_parts: dict[str, str] = {}
        self.thinking_buffers: dict[str, str] = {}
        self.thinking_segments: list[dict[str, Any]] = []
        self.tools: dict[str, dict[str, Any]] = {}
        self.errors: list[str] = []
        self.status = "ok"

    def record_payload(self, payload: dict[str, Any]) -> None:
        event_type = payload.get("type")
        if event_type == "text":
            block_id = str(payload.get("id") or "default")
            self.assistant_text_parts[block_id] = (
                self.assistant_text_parts.get(block_id, "") + str(payload.get("text", ""))
            )
        elif event_type == "thinking_delta":
            block_id = str(payload.get("id") or "default")
            delta = str(payload.get("text", ""))
            if delta:
                self.thinking_buffers[block_id] = self.thinking_buffers.get(block_id, "") + delta
        elif event_type == "thinking_end":
            block_id = str(payload.get("id") or "default")
            content = str(payload.get("content", "")).strip()
            if not content:
                content = self.thinking_buffers.pop(block_id, "").strip()
            else:
                self.thinking_buffers.pop(block_id, None)
            if content:
                self.thinking_segments.append(
                    {
                        "id": payload.get("id"),
                        "title": payload.get("title", "推理过程"),
                        "content": content,
                    },
                )
        elif event_type == "tool_call":
            tool_id = str(payload.get("id") or uuid.uuid4().hex)
            entry = self.tools.setdefault(
                tool_id,
                {
                    "id": tool_id,
                    "name": payload.get("name"),
                    "title": payload.get("title"),
                    "status": payload.get("status"),
                },
            )
            if payload.get("input"):
                entry["input"] = _truncate(str(payload["input"]))
            entry["name"] = payload.get("name") or entry.get("name")
            entry["title"] = payload.get("title") or entry.get("title")
        elif event_type == "tool_result":
            tool_id = str(payload.get("id") or "")
            entry = self.tools.setdefault(
                tool_id or uuid.uuid4().hex,
                {
                    "id": tool_id,
                    "name": payload.get("name"),
                    "title": payload.get("title"),
                },
            )
            if payload.get("output"):
                entry["output"] = _truncate(str(payload["output"]))
            if payload.get("summary"):
                entry["summary"] = str(payload["summary"])
            entry["status"] = payload.get("status") or "done"
        elif event_type == "error":
            self.status = "error"
            self.errors.append(str(payload.get("message", "unknown error")))

    def build_record(self) -> dict[str, Any]:
        duration_ms = int((time.perf_counter() - self.started_at) * 1000)
        assistant_text = "\n".join(
            part.strip()
            for part in self.assistant_text_parts.values()
            if part.strip()
        )
        tool_list = list(self.tools.values())
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "turn_id": self.turn_id,
            "session_id": self.session_id,
            "status": self.status,
            "duration_ms": duration_ms,
            "request": self.request,
            "response": {
                "assistant_text": _truncate(assistant_text),
                "thinking": self.thinking_segments,
                "tools": tool_list,
                "tool_names": [t.get("name") for t in tool_list if t.get("name")],
                "errors": self.errors,
            },
            "meta": {
                "agent_module": os.environ.get("PYTHON_AGENT_MODULE", "b2b_portal_agent"),
                "model": self.request.get("model") or os.environ.get("OPENAI_MODEL", ""),
                "base_url": os.environ.get("OPENAI_BASE_URL", ""),
            },
        }

    def save(self) -> Path | None:
        if not _enabled():
            return None

        record = self.build_record()
        day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        log_dir = _log_dir() / day
        ensure_log_dirs()
        log_dir.mkdir(parents=True, exist_ok=True)

        session_file = log_dir / f"{self.session_id}.jsonl"
        with session_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

        index_file = _log_dir() / "index.jsonl"
        index_file.parent.mkdir(parents=True, exist_ok=True)
        index_entry = {
            "ts": record["ts"],
            "turn_id": record["turn_id"],
            "session_id": record["session_id"],
            "status": record["status"],
            "duration_ms": record["duration_ms"],
            "message_preview": self.request.get("message_preview", ""),
            "tool_names": record["response"]["tool_names"],
            "error": record["response"]["errors"][0] if record["response"]["errors"] else None,
            "log_file": str(session_file.relative_to(_log_dir())).replace("\\", "/"),
        }
        with index_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(index_entry, ensure_ascii=False) + "\n")

        return session_file
