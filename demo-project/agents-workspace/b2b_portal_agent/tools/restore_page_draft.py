# -*- coding: utf-8 -*-
"""从会话版本栈恢复详情页草稿。"""
from __future__ import annotations

import copy
from typing import Any

from .content_generator import (
    _build_result_payload,
    _extract_content_modules,
    _parse_json_maybe,
)
from .draft_history import (
    push_draft_version,
    resolve_restore_target,
)
from .page_draft import slots_to_llm_draft
from .tool_guard import check_restore_allowed


async def restore_page_draft_stream(
    version: int = -1,
    *,
    page_spec: str | dict[str, Any] | None = None,
):
    guard_err = check_restore_allowed()
    if guard_err:
        yield {
            "type": "complete",
            "result": {
                "generationMode": "restore_failed",
                "generationError": guard_err,
                "restoreVersion": version,
            },
        }
        return

    target = resolve_restore_target(version)
    if not target:
        yield {
            "type": "complete",
            "result": {
                "generationMode": "restore_failed",
                "generationError": "无可用历史版本（至少需要 2 个版本才能回退到上一版）",
                "restoreVersion": version,
                "availableVersions": [],
            },
        }
        return

    restored = copy.deepcopy(target.draft)
    push_draft_version(
        restored,
        label=f"恢复至 v{target.version}",
        source="restore",
        skip_if_unchanged=False,
    )
    llm_draft = slots_to_llm_draft(restored)
    spec_data = _parse_json_maybe(page_spec) if page_spec else {}
    if not spec_data:
        spec_data = {
            "industryName": restored.get("industryName", ""),
            "productCategory": restored.get("productCategory", ""),
            "pageTemplateId": restored.get("templateId"),
            "generatableModules": restored.get("generatableModules") or [],
        }
    modules = _extract_content_modules(spec_data)
    if not modules:
        modules = [
            {"id": 1, "name": "产品名称", "fieldTarget": "layerA.title"},
            {"id": 0, "name": "产品概述", "fieldTarget": "layerA.overview"},
            {"id": 5, "name": "产品图片说明", "fieldTarget": "layerA.media"},
            {"id": 100, "name": "产品详情", "fieldTarget": "layerB.body"},
        ]

    yield {
        "type": "progress",
        "phase": "restoring",
        "message": f"正在恢复至 v{target.version}（{target.label}）…",
    }

    result = _build_result_payload(
        spec_data=spec_data,
        modules=modules,
        analysis={
            "industryName": restored.get("industryName"),
            "productCategory": restored.get("productCategory"),
        },
        user_message="恢复历史版本",
        draft=llm_draft,
        generation_mode="restore",
        generation_phase="final",
        draft_id=restored.get("draftId"),
    )
    result["restoredFromVersion"] = target.version
    result["restoredLabel"] = target.label
    result["complianceHint"] = (
        f"已恢复至历史版本 v{target.version}（{target.label}）。"
        "请在右侧预览确认；如需再往前回退可再次说明。"
    )

    yield {
        "type": "page_draft",
        "draft": result["pageDraft"],
        "draftState": "final",
        "message": result["complianceHint"],
    }
    yield {"type": "complete", "result": result}
