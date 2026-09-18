# -*- coding: utf-8 -*-
"""Phase A 金路径：一次跑完体检→定段→异常点→根因→任务说明（Mock 包）。"""
from __future__ import annotations

from typing import Any

from . import run_pack


def run_phase_a_golden_path(site_id: str = "site_demo_cnc") -> dict[str, Any]:
    """确定性编排，避免子 Agent 连打十余次 LLM。"""
    sid = (site_id or "site_demo_cnc").strip() or "site_demo_cnc"

    overview = run_pack("lg.scan.site_overview", site_id=sid)
    channel_mix = run_pack("lg.scan.channel_mix", site_id=sid)
    bounce_worst = run_pack("lg.scan.page_bounce_worst", site_id=sid)
    health = run_pack("lg.scan.health_blockers", site_id=sid)
    flags = run_pack("lg.scan.change_flags", site_id=sid)

    bounce_by_ch = run_pack("lg.landing.bounce_by_channel", site_id=sid)
    cxp = run_pack(
        "lg.landing.channel_x_page",
        site_id=sid,
        channel="ads",
        page_path="/campaign/cnc-oem-q3",
    )
    engage = run_pack(
        "lg.landing.page_engage",
        site_id=sid,
        page_path="/campaign/cnc-oem-q3",
    )
    page_health = run_pack(
        "lg.landing.page_health",
        site_id=sid,
        page_path="/campaign/cnc-oem-q3",
    )
    suspect = run_pack("lg.landing.suspect_summary", site_id=sid)
    ts = run_pack("lg.x.timeseries", site_id=sid, metric="ads_x_cnc_bounce")
    control = run_pack("lg.x.control_compare", site_id=sid)

    change_list = flags.get("rows") or []
    lead_flag = next((r for r in change_list if r.get("metric") == "lead_rate"), {})
    uv_flag = next((r for r in change_list if r.get("metric") == "uv"), {})
    bounce_flag = next((r for r in change_list if r.get("metric") == "bounce_rate"), {})

    funnel_stage = "落地页"
    locate_reason = (
        "留资率下跌主路径：全站 UV 未跌（持平）+ 跳出率升高 → 钉落地页，"
        "往内容/首屏/来路匹配排查。"
    )
    if (uv_flag.get("changeType") == "down") and bounce_flag.get("changeType") != "down":
        funnel_stage = "渠道到达"
        locate_reason = "UV 下跌且跳出未明显恶化 → 钉渠道到达"

    suspect_row = (suspect.get("rows") or [{}])[0]
    anomaly_point = {
        "本期变化": "留资率跌",
        "漏斗段定位在": funnel_stage,
        "具体落到": f"{suspect_row.get('channel')} × {suspect_row.get('page_path')}",
        "关键指标与对照": {
            "ads_x_page_bounce": suspect_row.get("bounce_rate"),
            "other_channel_same_page_bounce": suspect_row.get(
                "other_channel_same_page_bounce",
            ),
            "ads_duration_sec": suspect_row.get("avg_duration_sec"),
            "site_landing_duration_approx": suspect_row.get(
                "site_landing_duration_approx",
            ),
            "scroll_p75": suspect_row.get("scroll_p75"),
            "product_block_reach": suspect_row.get("product_block_reach"),
        },
        "和本期变化的关系": suspect_row.get("relation"),
        "该页流量是否可比": bool(suspect_row.get("min_uv_ok", True)),
    }

    root_cause = {
        "本期变化": "留资率跌",
        "漏斗段定位在": funnel_stage,
        "具体落到": anomaly_point["具体落到"],
        "根因是": "广告创意和落地页内容对不上",
        "置信度": "高",
        "核对结果": [
            "广告落到该页跳出高于其他渠同页：52% vs 42%，成立",
            "广告落到该页停留更短：28s vs 全站约 45s，成立",
            "滚动更浅、产品区到达偏低，成立",
            "时间先后：广告×页跳出抬升早于留资率跌到位（见 timeseries）",
            "控制变量：固定页后仅广告差；固定广告后该活动页最差，成立",
        ],
        "落在原因库": "流失原因库",
        "缺什么数": "无",
        "page_health": "无高危技术伤，可排除纯技术主因",
    }

    task_briefs = [
        {
            "本期变化": "留资率跌",
            "漏斗段定位在": funnel_stage,
            "具体落到": anomaly_point["具体落到"],
            "对应根因": "广告创意和落地页内容对不上（高）",
            "任务类型": "生成/重做营销落地页",
            "目标对象": "/campaign/cnc-oem-q3",
            "任务说明": {
                "页面类型": "留资获客页",
                "修改要求": [
                    "首屏必须出现广告承诺的「48小时打样」与「ISO9001」",
                    "广告没说过的卖点不要加码",
                    "新页做好后建议把广告落地地址切过去",
                ],
                "明确不做": "不在本任务内改投放后台创意",
            },
            "依据卡片": {
                "现状": "广告落到该页跳出约 52%，平均停留 28s，滚动多停首屏",
                "对照": "其他渠道落到同页跳出约 42%；全站落地停留约 45s",
                "动作": "按留资页重做并对齐广告承诺，再切落地",
            },
            "建议执行边界": "确认后交接内容运营",
        },
        {
            "本期变化": "留资率跌",
            "漏斗段定位在": funnel_stage,
            "具体落到": anomaly_point["具体落到"],
            "对应根因": "广告创意和落地页内容对不上（高）",
            "任务类型": "站外或人工处理建议",
            "目标对象": "该活动对应的广告创意与落地地址",
            "任务说明": {
                "建议谁处理": "投放侧",
                "建议做什么": "把广告文案和落地页对齐，或把落地地址切到重做后的新页",
            },
            "依据卡片": {
                "现状": "同上",
                "对照": "见营销页重做任务",
                "动作": "投放侧改创意或换落地（站内内容能力改不了投放后台）",
            },
            "建议执行边界": "仅展示",
        },
    ]

    return {
        "ok": True,
        "phase": "A",
        "site_id": sid,
        "pipeline": [
            "体检",
            "定段",
            "下钻",
            "假设验证",
            "任务说明",
            "定界（待确认/仅展示）",
        ],
        "change_list": change_list,
        "funnel_locate": {
            "stage": funnel_stage,
            "reason": locate_reason,
            "lead_rate_flag": lead_flag,
            "uv_flag": uv_flag,
            "bounce_flag": bounce_flag,
        },
        "anomaly_point": anomaly_point,
        "root_cause": root_cause,
        "task_briefs": task_briefs,
        "handoff": {
            "content_tasks": "pending_confirm",
            "external_tasks": "display_only",
            "note": "归因 Agent 不改站；内容类需客户确认后交接",
        },
        "pack_snapshots": {
            "overview_headline": (overview.get("summary") or {}).get("headline"),
            "channel_mix_headline": (channel_mix.get("summary") or {}).get("headline"),
            "bounce_worst_headline": (bounce_worst.get("summary") or {}).get("headline"),
            "health_headline": (health.get("summary") or {}).get("headline"),
            "bounce_by_channel_headline": (bounce_by_ch.get("summary") or {}).get(
                "headline",
            ),
            "engage_notes": engage.get("notes") or [],
            "page_health_headline": (page_health.get("summary") or {}).get("headline"),
            "timeseries_headline": (ts.get("summary") or {}).get("headline"),
            "control_headline": (control.get("summary") or {}).get("headline"),
            "cxp_rows": cxp.get("rows") or [],
        },
        "assistant_hint": (
            "请用中文向用户输出：变化清单 → 漏斗段 → 异常点 → 根因+置信度 → "
            "任务说明（可多条）→ 交接边界。不要再重复调用 analyze 补算。"
        ),
    }
