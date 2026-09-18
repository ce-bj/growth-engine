# -*- coding: utf-8 -*-
"""局部修订 ProductPageDraft v2 — 按槽位/章节补丁，避免全量重生成。"""
from __future__ import annotations

import html as html_lib
import json
import re
from typing import Any

from .content_generator import (
    _build_result_payload,
    _extract_content_modules,
    _parse_json_maybe,
)
from .page_draft import slots_to_llm_draft
from .tool_guard import check_patch_allowed

_H2_SECTION_RE = re.compile(
    r"(<h2[^>]*>)(.*?)(</h2>)(.*?)(?=<h2\b|$)",
    re.IGNORECASE | re.DOTALL,
)
_TAG_RE = re.compile(r"<[^>]+>")
_LEADING_H2_RE = re.compile(r"^\s*<h2\b[^>]*>.*?</h2>", re.IGNORECASE | re.DOTALL)


def _heading_text(raw: str) -> str:
    return _TAG_RE.sub("", raw or "").strip()


def _normalize_heading(text: str) -> str:
    return re.sub(r"\s+", "", (text or "").strip().lower())


def _strip_leading_h2(html: str, expected_heading: str) -> str:
    """``replace_section_html`` 若含与章节同名的 h2，自动去掉以免叠标题。"""
    if not html:
        return html
    match = _LEADING_H2_RE.match(html)
    if not match:
        return html
    title = _normalize_heading(_heading_text(match.group(0)))
    expected = _normalize_heading(expected_heading)
    if not expected or title == expected or expected in title or title in expected:
        return html[match.end() :].lstrip()
    return html


def find_duplicate_h2_headings(html: str) -> list[str]:
    """返回重复的 h2 标题原文列表（用于结构校验）。"""
    counts: dict[str, int] = {}
    labels: dict[str, str] = {}
    for match in _H2_SECTION_RE.finditer(html or ""):
        raw = _heading_text(match.group(2))
        key = _normalize_heading(raw)
        if not key:
            continue
        counts[key] = counts.get(key, 0) + 1
        labels.setdefault(key, raw)
    return [labels[k] for k, c in counts.items() if c > 1]


def validate_layer_b_html(html: str) -> list[str]:
    dups = find_duplicate_h2_headings(html)
    if not dups:
        return []
    return [f"B 层 HTML 存在重复 h2 标题：{'、'.join(dups)}"]


def patch_h2_section(html: str, section_heading: str, new_body_html: str) -> tuple[str, bool]:
    """将 ``section_heading`` 对应 h2 章节正文替换为 ``new_body_html``（不含 h2 本身）。"""
    if not html or not section_heading:
        return html, False
    target = _normalize_heading(section_heading)
    for match in _H2_SECTION_RE.finditer(html):
        title = _normalize_heading(_heading_text(match.group(2)))
        if title == target or target in title or title in target:
            start, end = match.span()
            replacement = f"{match.group(1)}{match.group(2)}{match.group(3)}{new_body_html}"
            return html[:start] + replacement + html[end:], True
    return html, False


def _build_paragraph_html(text: str, style: dict[str, str] | None = None) -> str:
    safe = html_lib.escape(str(text or ""))
    if not style:
        return f"<p>{safe}</p>"
    css = ";".join(f"{k}:{v}" for k, v in style.items() if v)
    return f'<p style="{css}">{safe}</p>'


def _parse_edits(edits: str | list[dict[str, Any]]) -> list[dict[str, Any]]:
    if isinstance(edits, list):
        return [e for e in edits if isinstance(e, dict)]
    data = _parse_json_maybe(edits)
    if isinstance(data, list):
        return [e for e in data if isinstance(e, dict)]
    if isinstance(data, dict) and isinstance(data.get("edits"), list):
        return [e for e in data["edits"] if isinstance(e, dict)]
    return []


def apply_edits_to_draft(
    page_draft: dict[str, Any],
    edits: list[dict[str, Any]],
) -> tuple[dict[str, Any], list[dict[str, Any]], list[str]]:
    """返回 (更新后的 page_draft 对应 llm_draft, applied_edits, errors)。"""
    draft = slots_to_llm_draft(page_draft)
    slots = dict(page_draft.get("slots") or {})
    applied: list[dict[str, Any]] = []
    errors: list[str] = []

    for edit in edits:
        target = str(edit.get("target") or edit.get("fieldTarget") or "").strip()
        action = str(edit.get("action") or "set").strip().lower()

        if target == "layerB.body" or target == "layerB":
            html = str((draft.get("htmlBody") or {}).get("html") or "")
            heading = str(
                edit.get("section_heading")
                or edit.get("sectionHeading")
                or edit.get("heading")
                or "",
            ).strip()
            if action in ("replace_section_html", "replace_html", "set_section"):
                new_body = str(edit.get("html") or edit.get("value") or "")
                if not heading:
                    errors.append("layerB.body 局部修改须提供 section_heading")
                    continue
                new_body = _strip_leading_h2(new_body, heading)
                patched, ok = patch_h2_section(html, heading, new_body)
            elif action in ("replace_text", "replace_section_text", "set_text"):
                text = str(edit.get("text") or edit.get("value") or "")
                style_raw = edit.get("style") if isinstance(edit.get("style"), dict) else {}
                color = edit.get("color") or style_raw.get("color")
                style = dict(style_raw)
                if color:
                    style["color"] = str(color)
                new_body = _build_paragraph_html(text, style or None)
                if not heading:
                    errors.append("layerB.body 文字替换须提供 section_heading（如「产品介绍」）")
                    continue
                patched, ok = patch_h2_section(html, heading, new_body)
            else:
                errors.append(f"不支持的 B 层 action: {action}")
                continue
            if not ok:
                errors.append(f"未找到 h2 章节「{heading}」，请核对 outline 或改用 revise 模式")
                continue
            struct_errors = validate_layer_b_html(patched)
            if struct_errors:
                errors.extend(struct_errors)
                continue
            draft["htmlBody"] = {
                **(draft.get("htmlBody") or {}),
                "html": patched,
            }
            slots["layerB.body"] = {
                **(slots.get("layerB.body") or {}),
                "type": "html_richtext",
                "label": "产品详情",
                "source": "agent",
                "value": draft["htmlBody"],
            }
            applied.append({**edit, "target": "layerB.body", "status": "applied"})

        elif target == "layerA.title":
            val = edit.get("value") or edit.get("text") or edit.get("headline")
            if isinstance(val, dict):
                title_val = val
            else:
                title_val = {"headline": str(val or ""), "sellingPoints": []}
            for field in draft["independentFields"]:
                if field.get("fieldTarget") == "layerA.title":
                    field["content"] = str(title_val.get("headline") or "")
            slots["layerA.title"] = {
                **(slots.get("layerA.title") or {}),
                "type": "title",
                "label": "产品名称",
                "source": "agent",
                "value": title_val,
            }
            applied.append({**edit, "target": "layerA.title", "status": "applied"})

        elif target == "layerA.overview":
            text = str(edit.get("value") or edit.get("text") or "")
            for field in draft["independentFields"]:
                if field.get("fieldTarget") == "layerA.overview":
                    field["content"] = text
            slots["layerA.overview"] = {
                **(slots.get("layerA.overview") or {}),
                "type": "overview",
                "label": "产品概述",
                "source": "agent",
                "value": text,
            }
            applied.append({**edit, "target": "layerA.overview", "status": "applied"})

        elif target == "layerA.media":
            val = edit.get("value")
            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except json.JSONDecodeError:
                    val = {"caption": val, "items": []}
            media = val if isinstance(val, dict) else {}
            content = json.dumps(media, ensure_ascii=False)
            for field in draft["independentFields"]:
                if field.get("fieldTarget") == "layerA.media":
                    field["content"] = content
            slots["layerA.media"] = {
                **(slots.get("layerA.media") or {}),
                "type": "image_meta",
                "label": "产品图片说明",
                "source": "agent",
                "value": media,
            }
            applied.append({**edit, "target": "layerA.media", "status": "applied"})
        else:
            errors.append(f"未知 target: {target or '(空)'}")

    page_draft = {**page_draft, "slots": slots}
    return draft, applied, errors


async def patch_page_draft_stream(
    current_draft: str | dict[str, Any],
    edits: str | list[dict[str, Any]],
    *,
    page_spec: str | dict[str, Any] | None = None,
):
    """流式返回 page_draft 更新事件（与 generate 工具协议一致）。"""
    page_draft = _parse_json_maybe(current_draft) if not isinstance(current_draft, dict) else current_draft
    # 防御：LLM 可能传入完整工具结果（含 pageDraft 嵌套）而非纯 pageDraft
    if not page_draft.get("slots") and isinstance(page_draft.get("pageDraft"), dict):
        page_draft = page_draft["pageDraft"]
    # 再防御：slots 本身可能是 JSON 字符串而非 dict
    if isinstance(page_draft.get("slots"), str):
        page_draft["slots"] = _parse_json_maybe(page_draft["slots"])
    if not page_draft.get("slots"):
        yield {
            "type": "complete",
            "result": {
                "generationMode": "patch_failed",
                "generationError": "current_draft 缺少 slots，无法局部修改",
                "patchApplied": [],
                "patchErrors": ["invalid current_draft"],
            },
        }
        return

    edit_list = _parse_edits(edits)
    guard_err = check_patch_allowed(edit_list)
    if guard_err:
        yield {
            "type": "complete",
            "result": {
                "generationMode": "patch_failed",
                "generationError": guard_err,
                "patchApplied": [],
                "patchErrors": [guard_err],
            },
        }
        return

    if not edit_list:
        yield {
            "type": "complete",
            "result": {
                "generationMode": "patch_failed",
                "generationError": "edits 为空或 JSON 无法解析",
                "patchApplied": [],
                "patchErrors": ["empty edits"],
            },
        }
        return

    yield {
        "type": "progress",
        "phase": "patching",
        "completed": 0,
        "total": len(edit_list),
        "message": f"正在局部修订 {len(edit_list)} 处…",
    }

    llm_draft, applied, errors = apply_edits_to_draft(page_draft, edit_list)
    final_html = str((llm_draft.get("htmlBody") or {}).get("html") or "")
    final_struct = validate_layer_b_html(final_html)
    if final_struct and applied:
        errors = list(dict.fromkeys(errors + final_struct))
        applied = []
        mode_hint = "patch_failed"
    else:
        mode_hint = None
    spec_data = _parse_json_maybe(page_spec) if page_spec else {}
    if not spec_data:
        spec_data = {
            "industryName": page_draft.get("industryName", ""),
            "productCategory": page_draft.get("productCategory", ""),
            "pageTemplateId": page_draft.get("templateId"),
            "generatableModules": page_draft.get("generatableModules") or [],
        }
    modules = _extract_content_modules(spec_data)
    if not modules:
        modules = [
            {"id": 1, "name": "产品名称", "fieldTarget": "layerA.title"},
            {"id": 0, "name": "产品概述", "fieldTarget": "layerA.overview"},
            {"id": 5, "name": "产品图片说明", "fieldTarget": "layerA.media"},
            {"id": 100, "name": "产品详情", "fieldTarget": "layerB.body"},
        ]

    draft_id = page_draft.get("draftId")
    if mode_hint:
        mode = mode_hint
    else:
        mode = "patch" if applied and not errors else ("patch_partial" if applied else "patch_failed")
    result = _build_result_payload(
        spec_data=spec_data,
        modules=modules,
        analysis={
            "industryName": page_draft.get("industryName"),
            "productCategory": page_draft.get("productCategory"),
        },
        user_message="局部修订",
        draft=llm_draft,
        generation_mode=mode,
        generation_phase="final",
        draft_id=draft_id,
    )
    result["patchApplied"] = applied
    result["patchErrors"] = errors
    result["complianceHint"] = (
        f"已局部修订 {len(applied)} 处；其余内容保持不变。"
        if applied
        else "局部修订失败，请检查 section_heading 或改用 revise 模式。"
    )
    if errors:
        result["complianceHint"] += " " + "; ".join(errors[:3])

    yield {
        "type": "page_draft",
        "draft": result["pageDraft"],
        "draftState": "final" if applied else "patch_failed",
        "message": result["complianceHint"],
    }
    yield {"type": "complete", "result": result}
