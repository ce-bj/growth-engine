# -*- coding: utf-8 -*-
"""主 Agent 委托工具：产品详情页 / 业务指标归因 + 其他域占位。"""
from __future__ import annotations

import asyncio
import json
import traceback
from collections.abc import AsyncGenerator
from typing import Any

from agentscope.event import EventType
from agentscope.message import TextBlock, ToolResultState, UserMsg
from agentscope.tool import ToolChunk

from ..pending_msg import (
    get_pending_model,
    get_pending_session_id,
    get_pending_user_msg,
)
from ..session_registry import get_or_create_agent


def _json_text(data: dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def _pct(value: Any, *, digits: int = 2) -> str:
    try:
        num = float(value)
    except (TypeError, ValueError):
        return "—"
    if abs(num) <= 1.5:
        return f"{num * 100:.{digits}f}%"
    return f"{num:.{digits}f}%"


def _fmt_metric_row(row: dict[str, Any]) -> str:
    metric = row.get("metric") or "—"
    labels = {
        "lead_rate": "留资率",
        "bounce_rate": "跳出率",
        "uv": "UV",
        "avg_duration_sec": "人均停留",
    }
    name = labels.get(str(metric), str(metric))
    current = row.get("current")
    baseline = row.get("baseline")
    change_type = row.get("changeType") or "—"
    severity = row.get("severity") or "—"
    if metric in ("lead_rate", "bounce_rate"):
        cur_s, base_s = _pct(current), _pct(baseline)
    elif metric == "avg_duration_sec":
        cur_s = f"{current}s" if current is not None else "—"
        base_s = f"{baseline}s" if baseline is not None else "—"
    else:
        cur_s = f"{current:,}" if isinstance(current, (int, float)) else str(current or "—")
        base_s = (
            f"{baseline:,}" if isinstance(baseline, (int, float)) else str(baseline or "—")
        )
    change_map = {"down": "变差/下跌", "up": "变好/上升", "flat": "持平"}
    change_s = change_map.get(str(change_type), str(change_type))
    return f"| **{name}** | {cur_s} | {base_s} | {change_s} | {severity} |"


def format_attribution_report(payload: dict[str, Any]) -> str:
    """把金路径结构化结果渲染成聊天用完整长文 Markdown。"""
    change_list = payload.get("change_list") or []
    locate = payload.get("funnel_locate") or {}
    anomaly = payload.get("anomaly_point") or {}
    root = payload.get("root_cause") or {}
    briefs = payload.get("task_briefs") or []
    handoff = payload.get("handoff") or {}
    metrics = anomaly.get("关键指标与对照") or {}

    lines: list[str] = [
        "## 留资率下跌诊断（Phase A 完整版）",
        "",
        "### 一、变化清单",
        "",
        "| 指标 | 本期 | 基线 | 变化 | 严重度 |",
        "|---|---|---|---|---|",
    ]
    if change_list:
        lines.extend(_fmt_metric_row(r) for r in change_list if isinstance(r, dict))
    else:
        lines.append("| — | — | — | — | — |")

    stage = locate.get("stage") or anomaly.get("漏斗段定位在") or "—"
    reason = locate.get("reason") or ""
    lines.extend(
        [
            "",
            "### 二、漏斗段定位",
            "",
            f"钉在 **{stage}**。",
        ],
    )
    if reason:
        lines.append(f"依据：{reason}")

    hit = anomaly.get("具体落到") or "—"
    lines.extend(
        [
            "",
            "### 三、异常点",
            "",
            f"具体落到：**{hit}**",
            "",
            "| 指标 | 广告来客 | 其他渠道同页 | 全站参考 |",
            "|---|---|---|---|",
            (
                f"| 跳出率 | {_pct(metrics.get('ads_x_page_bounce'))} | "
                f"{_pct(metrics.get('other_channel_same_page_bounce'))} | — |"
            ),
            (
                f"| 平均停留 | {metrics.get('ads_duration_sec') or '—'}s | — | "
                f"约 {metrics.get('site_landing_duration_approx') or '—'}s |"
            ),
            f"| 滚动到 75% | {_pct(metrics.get('scroll_p75'), digits=0)} | — | — |",
            (
                f"| 产品区到达 | {_pct(metrics.get('product_block_reach'), digits=0)} "
                f"| — | — |"
            ),
            "",
            str(anomaly.get("和本期变化的关系") or ""),
        ],
    )

    checks = root.get("核对结果") or []
    lines.extend(
        [
            "",
            "### 四、根因",
            "",
            f"**{root.get('根因是') or '—'}**（置信度：{root.get('置信度') or '—'}）",
            "",
            "核对：",
        ],
    )
    if checks:
        lines.extend(f"- {item}" for item in checks)
    else:
        lines.append("- （无逐条核对）")
    if root.get("page_health"):
        lines.append(f"- 页面健康：{root['page_health']}")

    lines.extend(["", "### 五、任务说明", ""])
    if not briefs:
        lines.append("（暂无任务说明）")
    for idx, brief in enumerate(briefs, start=1):
        if not isinstance(brief, dict):
            continue
        spec = brief.get("任务说明") or {}
        lines.append(
            f"**任务 {idx}：{brief.get('任务类型') or '任务'}**"
            f"（{brief.get('建议执行边界') or '—'}）",
        )
        lines.append(f"- 目标对象：`{brief.get('目标对象') or '—'}`")
        lines.append(f"- 对应根因：{brief.get('对应根因') or '—'}")
        if isinstance(spec, dict):
            if spec.get("页面类型"):
                lines.append(f"- 页面类型：{spec['页面类型']}")
            reqs = spec.get("修改要求") or []
            if reqs:
                lines.append("- 修改要求：")
                lines.extend(f"  {i}. {r}" for i, r in enumerate(reqs, start=1))
            if spec.get("明确不做"):
                lines.append(f"- 明确不做：{spec['明确不做']}")
            if spec.get("建议谁处理"):
                lines.append(f"- 建议谁处理：{spec['建议谁处理']}")
            if spec.get("建议做什么"):
                lines.append(f"- 建议做什么：{spec['建议做什么']}")
        lines.append("")

    lines.extend(
        [
            "### 六、交接边界",
            "",
            "| 类型 | 状态 |",
            "|---|---|",
            f"| 内容类（重做页） | {handoff.get('content_tasks') or '—'} |",
            f"| 站外类（投放） | {handoff.get('external_tasks') or '—'} |",
            "",
            handoff.get("note")
            or "归因 Agent 不改站；内容类需确认后交接，站外类仅展示。",
            "",
            "如需确认交接，或展开某个分析包的原始卡片，请告诉我。",
        ],
    )
    return "\n".join(line for line in lines if line is not None).strip() + "\n"


def _encode_nested_progress(message: str, *, phase: str = "delegate") -> str:
    from b2b_portal_agent.tools.content_stream import encode_stream_event

    return encode_stream_event(
        {
            "type": "progress",
            "phase": phase,
            "completed": 0,
            "total": 0,
            "message": message,
        },
    )


def _build_user_msg(instruction: str, *, default_text: str) -> UserMsg:
    pending = get_pending_user_msg()
    note = (instruction or "").strip()
    if pending is None:
        return UserMsg(name="user", content=[TextBlock(text=note or default_text)])
    if not note:
        return pending

    content = list(pending.content or [])
    if content and isinstance(content[0], TextBlock):
        content[0] = TextBlock(
            text=f"【主Agent委托说明】{note}\n\n{content[0].text}",
        )
    else:
        content.insert(0, TextBlock(text=f"【主Agent委托说明】{note}"))
    return UserMsg(name=getattr(pending, "name", None) or "user", content=content)


async def _stream_specialist(
    *,
    kind: str,
    agent_factory,
    instruction: str,
    agent_label: str,
    default_user_text: str,
) -> AsyncGenerator[ToolChunk, None]:
    text_bits: list[str] = []
    last_page_draft: dict[str, Any] | None = None
    last_tool_json: dict[str, Any] | None = None
    error_msg: str | None = None

    try:
        session_id = get_pending_session_id()
        model_name = get_pending_model()
        specialist = await get_or_create_agent(
            kind=kind,
            session_id=session_id,
            model_name=model_name,
            factory=agent_factory,
        )
        user_msg = _build_user_msg(instruction, default_text=default_user_text)

        yield ToolChunk(
            content=[
                TextBlock(
                    text=_encode_nested_progress(f"已委托「{agent_label}」处理…"),
                ),
            ],
            state=ToolResultState.RUNNING,
            is_last=False,
        )

        tool_outputs: dict[str, str] = {}
        tool_names: dict[str, str] = {}
        progress_bufs: dict[str, str] = {}

        from b2b_portal_agent.tools.content_stream import (
            consume_tool_output_delta,
            encode_stream_event,
        )

        # 防止 Langfuse/模型卡住时前端无限转圈；超时后仍返回已收集摘要
        import os

        nest_timeout = float(os.environ.get("SPECIALIST_REPLY_TIMEOUT_SEC", "90") or "90")
        deadline = asyncio.get_event_loop().time() + nest_timeout
        stream = specialist.reply_stream(user_msg).__aiter__()
        while True:
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                raise TimeoutError(
                    f"「{agent_label}」超过 {nest_timeout:.0f}s 未完成（常见于 OTEL/模型卡住）",
                )
            try:
                evt = await asyncio.wait_for(stream.__anext__(), timeout=remaining)
            except StopAsyncIteration:
                break
            et = evt.type
            if et == EventType.TOOL_CALL_START:
                tool_names[evt.tool_call_id] = evt.tool_call_name
                tool_outputs[evt.tool_call_id] = ""
                progress_bufs[evt.tool_call_id] = ""
                yield ToolChunk(
                    content=[
                        TextBlock(
                            text=_encode_nested_progress(
                                f"「{agent_label}」调用工具：{evt.tool_call_name}",
                                phase="nested_tool",
                            ),
                        ),
                    ],
                    state=ToolResultState.RUNNING,
                    is_last=False,
                )
            elif et == EventType.TOOL_RESULT_TEXT_DELTA:
                tid = evt.tool_call_id
                if not evt.delta:
                    continue
                pending = progress_bufs.get(tid, "")
                clean, stream_events, pending = consume_tool_output_delta(
                    pending,
                    evt.delta,
                )
                progress_bufs[tid] = pending
                if clean:
                    tool_outputs[tid] = tool_outputs.get(tid, "") + clean
                for stream_ev in stream_events:
                    yield ToolChunk(
                        content=[TextBlock(text=encode_stream_event(stream_ev))],
                        state=ToolResultState.RUNNING,
                        is_last=False,
                    )
            elif et == EventType.TOOL_RESULT_END:
                tid = evt.tool_call_id
                name = tool_names.pop(tid, "")
                progress_bufs.pop(tid, None)
                clean = tool_outputs.pop(tid, "").strip()
                if clean.startswith("{") and name in (
                    "generate_product_content",
                    "patch_page_draft",
                    "restore_page_draft",
                    "analyze",
                    "get_snapshot",
                    "get_metric_detail",
                    "get_page_content",
                    "lookup_cause_action_map",
                    "record_handoff_mock",
                ):
                    try:
                        parsed = json.loads(clean)
                        if isinstance(parsed, dict):
                            last_tool_json = parsed
                            draft = parsed.get("pageDraft")
                            if isinstance(draft, dict):
                                last_page_draft = draft
                    except json.JSONDecodeError:
                        pass
            elif et == EventType.TEXT_BLOCK_DELTA:
                if evt.delta:
                    text_bits.append(evt.delta)
    except Exception as exc:  # noqa: BLE001
        error_msg = f"{type(exc).__name__}: {exc}"
        traceback.print_exc()
        yield ToolChunk(
            content=[
                TextBlock(
                    text=_encode_nested_progress(
                        f"「{agent_label}」执行失败：{error_msg}",
                        phase="error",
                    ),
                ),
            ],
            state=ToolResultState.RUNNING,
            is_last=False,
        )

    specialist_text = "".join(text_bits).strip()
    summary: dict[str, Any] = {
        "delegatedTo": agent_label,
        "ok": error_msg is None,
        "assistantSummary": specialist_text[:12000],
        "reportMarkdown": None,
        "error": error_msg,
        "generationMode": (last_tool_json or {}).get("generationMode"),
        "coverage": (last_tool_json or {}).get("coverage"),
        "draftTitle": (last_tool_json or {}).get("draftTitle")
        or ((last_page_draft or {}).get("draftTitle")),
        "pageDraft": last_page_draft,
        "attribution": None,
        "note": "请据此向用户做中文说明。",
    }
    if isinstance(last_tool_json, dict) and (
        last_tool_json.get("hypotheses")
        or last_tool_json.get("locate")
        or last_tool_json.get("task_briefs")
        or last_tool_json.get("root_cause")
        or last_tool_json.get("phase") == "A"
    ):
        summary["attribution"] = {
            "locate": last_tool_json.get("locate") or last_tool_json.get("funnel_locate"),
            "drill": last_tool_json.get("drill"),
            "hypotheses": [
                {
                    "id": h.get("id"),
                    "name": h.get("name"),
                    "result": h.get("result"),
                    "in_scope": h.get("in_scope"),
                }
                for h in (last_tool_json.get("hypotheses") or [])
            ],
            "tasks": last_tool_json.get("tasks") or last_tool_json.get("task_briefs"),
            "anomaly_point": last_tool_json.get("anomaly_point"),
            "root_cause": last_tool_json.get("root_cause"),
        }
        if last_tool_json.get("task_briefs") or last_tool_json.get("phase") == "A":
            report_md = format_attribution_report(last_tool_json)
            summary["reportMarkdown"] = report_md
            if len(specialist_text) < 800:
                summary["assistantSummary"] = report_md
            summary["note"] = (
                "业务指标归因：请把 reportMarkdown（或完整 assistantSummary）"
                "作为聊天长文完整转述给用户，保留六节与表格，禁止压成短摘要。"
            )

    yield ToolChunk(
        content=[TextBlock(text=_json_text(summary))],
        state=ToolResultState.SUCCESS if error_msg is None else ToolResultState.ERROR,
        is_last=True,
    )


async def delegate_product_detail_agent(
    instruction: str = "",
) -> AsyncGenerator[ToolChunk, None]:
    """委托「产品详情页 Agent」处理生成 / 修改 / 回退详情页草稿。"""
    from b2b_portal_agent.agent import build_agent as build_product_detail_agent
    from b2b_portal_agent.agent import build_model

    model_name = get_pending_model()

    def factory():
        # 嵌套委托关闭 Tracing，避免 Langfuse Simple 导出拖死
        try:
            return build_product_detail_agent(
                model=build_model(model_name),
                enable_tracing=False,
            )
        except TypeError:
            return build_product_detail_agent(model=build_model(model_name))

    async for chunk in _stream_specialist(
        kind="product_detail",
        agent_factory=factory,
        instruction=instruction,
        agent_label="产品详情页 Agent",
        default_user_text="请处理产品详情页相关请求。",
    ):
        yield chunk


async def delegate_metrics_agent(
    instruction: str = "",
) -> AsyncGenerator[ToolChunk, None]:
    """发起「业务指标归因 Agent」会话托管（Handoff），不再嵌套跑完整轮。

    Bridge 收到 handoff=true 后会：specialist_enter → 首句转发 → 子 Agent 直聊。
    """
    payload = {
        "ok": True,
        "handoff": True,
        "specialistId": "metrics",
        "specialistName": "业务指标归因 Agent",
        "taskLabel": "增长诊断",
        "instruction": (instruction or "").strip(),
        "message": "已请求将会话托管给业务指标归因 Agent，请等待前端进入托管框。",
        "note": "主 Agent 本轮不要对用户说话（不要转交话、不要教点关闭）；诊断由子 Agent 在托管会话中直接输出。",
    }
    yield ToolChunk(
        content=[TextBlock(text=_json_text(payload))],
        state=ToolResultState.SUCCESS,
        is_last=True,
    )


async def delegate_marketing_page_agent(instruction: str = "") -> ToolChunk:
    """（占位）委托智能营销页 Agent。Demo 尚未接入。"""
    _ = instruction
    return ToolChunk(
        content=[
            TextBlock(
                text=_json_text(
                    {
                        "delegatedTo": "智能营销页 Agent",
                        "ok": False,
                        "status": "not_implemented",
                        "message": "Demo 尚未接入智能营销页 Agent，请后续迭代启用。",
                    },
                ),
            ),
        ],
    )


async def delegate_site_content_agent(instruction: str = "") -> ToolChunk:
    """（占位）委托站点内容 Agent（资讯/案例等）。Demo 尚未接入。"""
    _ = instruction
    return ToolChunk(
        content=[
            TextBlock(
                text=_json_text(
                    {
                        "delegatedTo": "站点内容 Agent",
                        "ok": False,
                        "status": "not_implemented",
                        "message": "Demo 尚未接入站点内容 Agent，请后续迭代启用。",
                    },
                ),
            ),
        ],
    )


async def list_available_agents() -> ToolChunk:
    """仅当用户明确询问「你能做什么 / 有哪些能力 / 有哪些 Agent」时调用。

    严禁在「你好」「在吗」「谢谢」等闲聊问候场景调用；闲聊由主 Agent 直接文字回复。
    """
    return ToolChunk(
        content=[
            TextBlock(
                text=_json_text(
                    {
                        "agents": [
                            {
                                "id": "product_detail",
                                "name": "产品详情页 Agent",
                                "status": "ready",
                                "tool": "delegate_product_detail_agent",
                            },
                            {
                                "id": "metrics",
                                "name": "业务指标归因 Agent",
                                "status": "ready",
                                "tool": "delegate_metrics_agent",
                                "phase": "A",
                                "note": "读 snapshot：留资率跌→钉流失点→假设核对→任务说明（site_demo_b2b）",
                            },
                            {
                                "id": "marketing_page",
                                "name": "智能营销页 Agent",
                                "status": "placeholder",
                                "tool": "delegate_marketing_page_agent",
                            },
                            {
                                "id": "site_content",
                                "name": "站点内容 Agent",
                                "status": "placeholder",
                                "tool": "delegate_site_content_agent",
                            },
                        ],
                    },
                ),
            ),
        ],
    )
