# -*- coding: utf-8 -*-
"""归因 Agent 工具：只读指标服务产物，不算数。"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from agentscope.message import TextBlock
from agentscope.tool import ToolChunk

from growth_metrics_service.api import (
    get_metric_detail as _get_metric_detail,
    get_page_content as _get_page_content,
    get_snapshot as _get_snapshot,
    list_sites,
    propose_hypothesis as _propose_hypothesis,
)

_HANDOFF_DIR = Path(__file__).resolve().parents[1] / ".demo_state"
_HANDOFF_DIR.mkdir(exist_ok=True)

DEFAULT_SITE = "site_demo_b2b"


def _json_text(data: dict[str, Any] | list[Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def _ok(data: dict[str, Any] | list[Any]) -> ToolChunk:
    return ToolChunk(content=[TextBlock(text=_json_text(data))])


def _err(exc: Exception) -> ToolChunk:
    return _ok({"ok": False, "error": f"{type(exc).__name__}: {exc}", "sites": list_sites()})


async def get_snapshot(site_id: str = DEFAULT_SITE) -> ToolChunk:
    """一次拿到扫描、定位、下钻、假设核对、可复制发给运营助手的交接提示词。用户问留资为何跌 / 增长诊断时优先调用。

    数字已经算完。你只解读、写任务说明、回答追问，不要重算、不要改阈值。

    Args:
        site_id: 默认 ``site_demo_b2b``。
    """
    try:
        return _ok(_get_snapshot(site_id or DEFAULT_SITE))
    except Exception as exc:  # noqa: BLE001
        return _err(exc)


async def get_metric_detail(
    ref: str,
    site_id: str = DEFAULT_SITE,
    key: str = "",
) -> ToolChunk:
    """追问时取指标切片。用户说「路径UV」「帮我查路径UV」时，把原话原样传入。

    不要把「路径UV」改写成 ``UV@路径`` 或 ``UV@页面``。服务会按指标字典解析；
    查不到会返回 ``candidates``，把候选 ref 原样再查，不要自己拼名字。

    Args:
        ref: 用户原话或指标名，如 ``路径UV``、``帮我查路径UV``、``落地接住率@页面``。
        site_id: 站点 ID。
        key: 切片 key；渠道名、页面路径，或 ``渠道|页面``。空则返回该指标全部切片。
    """
    try:
        return _ok(_get_metric_detail(ref, site_id=site_id or DEFAULT_SITE, key=key))
    except Exception as exc:  # noqa: BLE001
        return _err(exc)


async def get_page_content(
    page_path: str,
    site_id: str = DEFAULT_SITE,
) -> ToolChunk:
    """读页正文，写任务说明用。抓不到就喊人，不要编参数。

    Args:
        page_path: 页面路径，如 ``/products/cnc-6061-bracket``。
        site_id: 站点 ID。
    """
    try:
        return _ok(_get_page_content(page_path, site_id=site_id or DEFAULT_SITE))
    except Exception as exc:  # noqa: BLE001
        return _err(exc)


async def propose_hypothesis(
    name: str,
    layer: str,
    when_text: str,
    how_to_verify: str,
    metrics_needed: str = "",
    site_id: str = DEFAULT_SITE,
    note: str = "",
) -> ToolChunk:
    """库内假设全不命中时提一条候选，落入待运营确认列表。没有入库权。

    Args:
        name: 假设一句话。
        layer: 访问入口 / 流失点1 / 流失点2 / 流失点3。
        when_text: 什么指标组合时成立。
        how_to_verify: 怎么用已有指标验证。
        metrics_needed: 需要哪些指标，逗号分隔。
        site_id: 站点 ID。
        note: 补充说明。
    """
    needed = [x.strip() for x in (metrics_needed or "").split(",") if x.strip()]
    try:
        return _ok(
            _propose_hypothesis(
                name=name,
                layer=layer,
                when_text=when_text,
                how_to_verify=how_to_verify,
                metrics_needed=needed,
                site_id=site_id or DEFAULT_SITE,
                note=note,
            ),
        )
    except Exception as exc:  # noqa: BLE001
        return _err(exc)


async def record_handoff_mock(
    task_type: str,
    target: str,
    status: str = "pending_confirm",
    summary: str = "",
) -> ToolChunk:
    """Mock 交接：本地记录状态，不真正改站。

    Args:
        task_type: 如「修改已有产品详情」。
        target: 目标 URL 或对象。
        status: pending_confirm / handed_off / display_only / repaired。
        summary: 一句话说明。
    """
    payload = {
        "task_type": task_type,
        "target": target,
        "status": status,
        "summary": summary,
        "boundary": (
            "仅展示"
            if ("建议" in task_type or "站外" in task_type)
            else ("直接修复" if "健康" in task_type else "确认后交接")
        ),
    }
    out = _HANDOFF_DIR / "last_handoff.json"
    out.write_text(_json_text(payload), encoding="utf-8")
    return _ok({"ok": True, "recorded": payload})
