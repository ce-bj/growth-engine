# -*- coding: utf-8 -*-
"""内容生成流式进度协议 — ToolChunk 文本内嵌事件，供 bridge 解析为 SSE。"""
from __future__ import annotations

import json
import re
from typing import Any, Callable

# 单字符分隔，避免污染最终 JSON 工具输出
GEN_PROGRESS_MARKER = "\x1eGEN_PROGRESS\x1f"
GEN_PROGRESS_END = "\x1e"


def encode_stream_event(payload: dict[str, Any]) -> str:
    """编码为 ToolChunk 增量文本（bridge 会剥离并转发为 SSE）。"""
    return f"{GEN_PROGRESS_MARKER}{json.dumps(payload, ensure_ascii=False)}{GEN_PROGRESS_END}"


ProgressCallback = Callable[[dict[str, Any]], None]


def emit_progress(
    callback: ProgressCallback | None,
    *,
    phase: str,
    completed: int,
    total: int,
    message: str,
    draft: dict[str, Any] | None = None,
    module_id: int | None = None,
    stream_chars: int = 0,
) -> None:
    if not callback:
        return
    event: dict[str, Any] = {
        "type": "progress",
        "phase": phase,
        "completed": completed,
        "total": total,
        "message": message,
    }
    if module_id is not None:
        event["moduleId"] = module_id
    if stream_chars:
        event["streamChars"] = stream_chars
    if draft is not None:
        event["type"] = "page_draft"
        event["draft"] = draft
        event["draftState"] = phase
    callback(event)


def split_stream_deltas(delta: str) -> tuple[str, list[dict[str, Any]]]:
    """从工具结果增量中分离进度事件与真实 JSON 正文。"""
    events: list[dict[str, Any]] = []
    buf = delta
    output_parts: list[str] = []
    while GEN_PROGRESS_MARKER in buf:
        start = buf.index(GEN_PROGRESS_MARKER)
        if start > 0:
            output_parts.append(buf[:start])
        end = buf.find(GEN_PROGRESS_END, start + len(GEN_PROGRESS_MARKER))
        if end < 0:
            output_parts.append(buf[:start])
            buf = buf[start:]
            break
        raw = buf[start + len(GEN_PROGRESS_MARKER) : end]
        buf = buf[end + len(GEN_PROGRESS_END) :]
        try:
            events.append(json.loads(raw))
        except json.JSONDecodeError:
            pass
    if buf:
        output_parts.append(buf)
    return "".join(output_parts), events


def consume_tool_output_delta(
    buffer: str,
    delta: str,
) -> tuple[str, list[dict[str, Any]], str]:
    """跨 SSE 增量拼接进度标记；返回 (正文增量, 事件列表, 新缓冲区)。"""
    combined = buffer + delta
    events: list[dict[str, Any]] = []
    output_parts: list[str] = []
    rest = combined
    while GEN_PROGRESS_MARKER in rest:
        start = rest.index(GEN_PROGRESS_MARKER)
        if start > 0:
            output_parts.append(rest[:start])
        end = rest.find(GEN_PROGRESS_END, start + len(GEN_PROGRESS_MARKER))
        if end < 0:
            return "".join(output_parts), events, rest[start:]
        raw = rest[start + len(GEN_PROGRESS_MARKER) : end]
        rest = rest[end + len(GEN_PROGRESS_END) :]
        try:
            events.append(json.loads(raw))
        except json.JSONDecodeError:
            pass
    output_parts.append(rest)
    return "".join(output_parts), events, ""


def extract_items_from_partial_json(text: str) -> list[dict[str, Any]]:
    """从流式 JSON 文本中提取已闭合的 items 元素（moduleId 对象）。"""
    items: list[dict[str, Any]] = []
    # 定位 items 数组后的对象块
    anchor = text.find('"items"')
    if anchor < 0:
        return items
    segment = text[anchor:]
    depth = 0
    obj_start = -1
    for idx, ch in enumerate(segment):
        if ch == "{":
            if depth == 0:
                obj_start = idx
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and obj_start >= 0:
                chunk = segment[obj_start : idx + 1]
                if '"moduleId"' in chunk:
                    try:
                        parsed = json.loads(chunk)
                        if isinstance(parsed, dict) and parsed.get("moduleId") is not None:
                            items.append(parsed)
                    except json.JSONDecodeError:
                        pass
                obj_start = -1
    return items


def dedupe_items_by_module_id(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[int] = set()
    out: list[dict[str, Any]] = []
    for item in items:
        mid = item.get("moduleId", item.get("id"))
        if mid is None:
            continue
        key = int(mid)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out
