# -*- coding: utf-8 -*-
"""Mock 分析包执行器：按 pack_id 返回统一结果卡。"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"
_PACK_VERSION = "1.0.0"
_DEFAULT_SITE = "site_demo_cnc"

SUPPORTED_PACKS = [
    "lg.scan.site_overview",
    "lg.scan.channel_mix",
    "lg.scan.page_traffic_top",
    "lg.scan.page_bounce_worst",
    "lg.scan.health_blockers",
    "lg.scan.change_flags",
    "lg.landing.bounce_by_channel",
    "lg.landing.duration_overview",
    "lg.landing.pages_bounce_worst",
    "lg.landing.page_engage",
    "lg.landing.channel_x_page",
    "lg.landing.page_health",
    "lg.landing.suspect_summary",
    "lg.x.timeseries",
    "lg.x.control_compare",
    "lg.x.pre_post_snapshot",
]


def _load_fixture(site_id: str) -> dict[str, Any]:
    sid = (site_id or _DEFAULT_SITE).strip() or _DEFAULT_SITE
    path = _FIXTURE_DIR / f"{sid}.json"
    if not path.is_file():
        path = _FIXTURE_DIR / f"{_DEFAULT_SITE}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _card(
    pack_id: str,
    fx: dict[str, Any],
    *,
    filters: dict[str, Any] | None = None,
    data_status: str = "ok",
    missing_fields: list[str] | None = None,
    summary: dict[str, Any] | None = None,
    rows: list[Any] | None = None,
    comparisons: list[Any] | None = None,
    timeseries: list[Any] | None = None,
    notes: list[str] | None = None,
    sample: dict[str, Any] | None = None,
) -> dict[str, Any]:
    scan = fx.get("scan") or {}
    return {
        "pack_id": pack_id,
        "pack_version": _PACK_VERSION,
        "metric_dict_version": fx.get("metric_dict_version", "2026-08-01"),
        "site_id": fx.get("site_id"),
        "period": fx.get("period"),
        "filters": filters or {},
        "data_status": data_status,
        "missing_fields": missing_fields or [],
        "sample": sample
        or {
            "uv": (scan.get("uv") or {}).get("current"),
            "leads": (scan.get("leads") or {}).get("current"),
            "min_uv_ok": True,
        },
        "summary": summary or {"headline": "", "direction": "n/a"},
        "rows": rows or [],
        "comparisons": comparisons or [],
        "timeseries": timeseries or [],
        "notes": notes or [],
    }


def run_pack(
    pack_id: str,
    *,
    site_id: str = _DEFAULT_SITE,
    channel: str = "",
    page_path: str = "",
    metric: str = "",
    days: int = 30,
) -> dict[str, Any]:
    pid = (pack_id or "").strip()
    if pid not in SUPPORTED_PACKS:
        return {
            "pack_id": pid or "unknown",
            "pack_version": _PACK_VERSION,
            "data_status": "unavailable",
            "missing_fields": ["pack_id"],
            "summary": {
                "headline": f"未实现的分析包：{pid}",
                "direction": "n/a",
            },
            "rows": [],
            "comparisons": [],
            "timeseries": [],
            "notes": [f"Phase A 支持：{', '.join(SUPPORTED_PACKS)}"],
            "supported_packs": SUPPORTED_PACKS,
        }

    fx = _load_fixture(site_id)
    filters = {
        k: v
        for k, v in {
            "channel": channel or None,
            "page_path": page_path or None,
            "metric": metric or None,
            "days": days,
        }.items()
        if v not in (None, "")
    }

    handlers = {
        "lg.scan.site_overview": _pack_site_overview,
        "lg.scan.channel_mix": _pack_channel_mix,
        "lg.scan.page_traffic_top": _pack_page_traffic_top,
        "lg.scan.page_bounce_worst": _pack_page_bounce_worst,
        "lg.scan.health_blockers": _pack_health,
        "lg.scan.change_flags": _pack_change_flags,
        "lg.landing.bounce_by_channel": _pack_bounce_by_channel,
        "lg.landing.duration_overview": _pack_duration,
        "lg.landing.pages_bounce_worst": _pack_page_bounce_worst,
        "lg.landing.page_engage": _pack_page_engage,
        "lg.landing.channel_x_page": _pack_channel_x_page,
        "lg.landing.page_health": _pack_page_health,
        "lg.landing.suspect_summary": _pack_landing_suspect,
        "lg.x.timeseries": _pack_timeseries,
        "lg.x.control_compare": _pack_control_compare,
        "lg.x.pre_post_snapshot": _pack_pre_post,
    }
    return handlers[pid](fx, filters=filters, pack_id=pid)


def _pack_site_overview(
    fx: dict[str, Any],
    *, filters: dict[str, Any], pack_id: str = "lg.scan.site_overview", **_kw: Any) -> dict[str, Any]:
    scan = fx["scan"]
    rows = [
        {"metric": "uv", **scan["uv"]},
        {"metric": "leads", **scan["leads"]},
        {"metric": "lead_rate", **scan["lead_rate"]},
        {"metric": "bounce_rate", **scan["bounce_rate"]},
        {"metric": "avg_duration_sec", **scan["avg_duration_sec"]},
        {"metric": "core_page_reach", **scan["core_page_reach"]},
    ]
    return _card(
        "lg.scan.site_overview",
        fx,
        filters=filters,
        summary={
            "headline": (
                f"留资率 {scan['lead_rate']['current']:.2%} "
                f"（对照 {scan['lead_rate']['baseline']:.2%}，"
                f"{scan['lead_rate']['pp']*100:.1f}pp），UV 基本持平"
            ),
            "direction": "down",
        },
        rows=rows,
        comparisons=[
            {
                "metric": "lead_rate",
                "vs": "past_4w_same",
                "current": scan["lead_rate"]["current"],
                "baseline": scan["lead_rate"]["baseline"],
                "delta_pp": scan["lead_rate"]["pp"],
            },
            {
                "metric": "uv",
                "vs": "past_4w_same",
                "current": scan["uv"]["current"],
                "baseline": scan["uv"]["baseline"],
                "wow": scan["uv"]["wow"],
            },
        ],
        notes=["Phase A fixture：金路径演示数据"],
    )


def _pack_channel_mix(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    rows = []
    for c in fx["channels"]:
        rows.append(
            {
                "channel": c["channel"],
                "uv": c["uv"],
                "uv_share": c["uv_share"],
                "uv_share_baseline": c["uv_share_baseline"],
                "lead_rate": c["lead_rate"],
                "lead_rate_baseline": c["lead_rate_baseline"],
                "bounce_rate": c["bounce_rate"],
            },
        )
    return _card(
        "lg.scan.channel_mix",
        fx,
        filters=filters,
        summary={
            "headline": "广告渠道留资率明显低于 SEO/直接访问",
            "direction": "down",
        },
        rows=rows,
    )


def _pack_page_traffic_top(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    pages = sorted(fx["pages"], key=lambda p: p["uv"], reverse=True)
    rows = [
        {
            "page_path": p["page_path"],
            "uv": p["uv"],
            "avg_duration_sec": p["avg_duration_sec"],
            "exit_rate": p["exit_rate"],
            "min_uv_ok": p["uv"] >= 10,
        }
        for p in pages
    ]
    return _card(
        "lg.scan.page_traffic_top",
        fx,
        filters=filters,
        summary={"headline": "高流量页 TOP（按 UV）", "direction": "n/a"},
        rows=rows,
    )


def _pack_page_bounce_worst(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    site_bounce = fx["scan"]["bounce_rate"]["current"]
    pages = [p for p in fx["pages"] if p["uv"] >= 10]
    pages = sorted(pages, key=lambda p: p["bounce_rate"], reverse=True)
    rows = [
        {
            "page_path": p["page_path"],
            "uv": p["uv"],
            "bounce_rate": p["bounce_rate"],
            "vs_site_bounce": round(p["bounce_rate"] - site_bounce, 4),
            "min_uv_ok": True,
        }
        for p in pages
    ]
    return _card(
        pack_id or "lg.scan.page_bounce_worst",
        fx,
        filters=filters,
        summary={
            "headline": f"高流量跳出最差：{rows[0]['page_path']}（{rows[0]['bounce_rate']:.0%}）",
            "direction": "down",
        },
        rows=rows,
        comparisons=[{"metric": "site_bounce_rate", "value": site_bounce}],
    )


def _pack_health(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    scan = fx["scan"]
    return _card(
        "lg.scan.health_blockers",
        fx,
        filters=filters,
        summary={
            "headline": f"健康分 {scan['health_score']}，高危待办 {scan['critical_issues']}",
            "direction": "flat",
        },
        rows=[
            {
                "health_score": scan["health_score"],
                "critical_issues": scan["critical_issues"],
                "issues": [],
            },
        ],
        notes=["本期无高危阻断；不要把流量问题误判成站坏了"],
    )


def _pack_change_flags(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    scan = fx["scan"]
    rows = [
        {
            "metric": "lead_rate",
            "changeType": "down",
            "severity": "P0",
            "rule": "环比跌幅>20% 或绝对值偏低",
            "current": scan["lead_rate"]["current"],
            "baseline": scan["lead_rate"]["baseline"],
            "source": "rule",
        },
        {
            "metric": "bounce_rate",
            "changeType": "down",
            "severity": "P1",
            "rule": "环比升高>15%",
            "current": scan["bounce_rate"]["current"],
            "baseline": scan["bounce_rate"]["baseline"],
            "source": "rule",
            "note": "对跳出率，升=坏，changeType 仍记 down（变坏）",
        },
        {
            "metric": "uv",
            "changeType": "flat",
            "severity": None,
            "rule": "环比在±15%内",
            "current": scan["uv"]["current"],
            "baseline": scan["uv"]["baseline"],
            "source": "rule",
        },
        {
            "metric": "avg_duration_sec",
            "changeType": "down",
            "severity": "P1",
            "rule": "环比跌幅>20%",
            "current": scan["avg_duration_sec"]["current"],
            "baseline": scan["avg_duration_sec"]["baseline"],
            "source": "rule",
        },
    ]
    return _card(
        "lg.scan.change_flags",
        fx,
        filters=filters,
        summary={
            "headline": "P0：留资率下跌；UV 持平；跳出率/访问时长变坏",
            "direction": "down",
        },
        rows=rows,
        notes=["定段提示：UV 未跌 + 跳出升 → 优先钉落地页（留资主路径）"],
    )


def _pack_bounce_by_channel(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    site_b = fx["scan"]["bounce_rate"]["current"]
    rows = [
        {
            "channel": c["channel"],
            "bounce_rate": c["bounce_rate"],
            "vs_site": round(c["bounce_rate"] - site_b, 4),
            "avg_duration_sec": c["avg_duration_sec"],
        }
        for c in fx["channels"]
    ]
    return _card(
        "lg.landing.bounce_by_channel",
        fx,
        filters=filters,
        summary={
            "headline": "广告渠道跳出明显高于全站，SEO/直接接近或优于全站",
            "direction": "down",
        },
        rows=rows,
        comparisons=[{"metric": "site_bounce_rate", "value": site_b}],
    )


def _pack_duration(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    scan = fx["scan"]
    return _card(
        "lg.landing.duration_overview",
        fx,
        filters=filters,
        summary={
            "headline": (
                f"平均访问时长 {scan['avg_duration_sec']['current']}s "
                f"（对照 {scan['avg_duration_sec']['baseline']}s）"
            ),
            "direction": "down",
        },
        rows=[
            {"scope": "site", **scan["avg_duration_sec"]},
            *[
                {
                    "scope": "channel",
                    "channel": c["channel"],
                    "avg_duration_sec": c["avg_duration_sec"],
                }
                for c in fx["channels"]
            ],
        ],
    )


def _pack_page_engage(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    page = filters.get("page_path") or "/campaign/cnc-oem-q3"
    hit = next((p for p in fx["pages"] if p["page_path"] == page), fx["pages"][0])
    return _card(
        "lg.landing.page_engage",
        fx,
        filters=filters,
        summary={
            "headline": (
                f"{hit['page_path']} 跳出 {hit['bounce_rate']:.0%}，"
                f"停留 {hit['avg_duration_sec']}s，滚动 P75={hit['scroll_p75']:.0%}"
            ),
            "direction": "down",
        },
        rows=[hit],
        notes=[
            f"广告创意主打：{fx.get('ad_creative_claim')}",
            f"落地页首屏实际：{fx.get('landing_hero_claim')}",
        ],
    )


def _pack_channel_x_page(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    rows = list(fx["channel_x_page"])
    ch = filters.get("channel")
    page = filters.get("page_path")
    if ch:
        rows = [r for r in rows if r["channel"] == ch]
    if page:
        rows = [r for r in rows if r["page_path"] == page]
    if not rows:
        rows = list(fx["channel_x_page"])
    return _card(
        "lg.landing.channel_x_page",
        fx,
        filters=filters,
        summary={
            "headline": "广告 × /campaign/cnc-oem-q3 承接明显差于其他渠落到同页",
            "direction": "down",
        },
        rows=rows,
        comparisons=[
            {
                "focus": "ads × /campaign/cnc-oem-q3",
                "bounce_rate": 0.52,
                "other_channels_same_page_bounce_approx": 0.42,
                "site_landing_duration_approx": 45,
                "ads_duration": 28,
            },
        ],
    )


def _pack_page_health(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    page = filters.get("page_path") or "/campaign/cnc-oem-q3"
    return _card(
        "lg.landing.page_health",
        fx,
        filters=filters,
        summary={"headline": f"{page} 无关联高危健康问题", "direction": "flat"},
        rows=[{"page_path": page, "issues": []}],
        notes=["可排除「加载慢/死链」作为主因"],
    )


def _pack_landing_suspect(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    return _card(
        "lg.landing.suspect_summary",
        fx,
        filters=filters,
        summary={
            "headline": "主异常点草稿：广告 × /campaign/cnc-oem-q3",
            "direction": "down",
        },
        rows=[
            {
                "rank": 1,
                "channel": "ads",
                "page_path": "/campaign/cnc-oem-q3",
                "bounce_rate": 0.52,
                "other_channel_same_page_bounce": 0.42,
                "avg_duration_sec": 28,
                "site_landing_duration_approx": 45,
                "scroll_p75": 0.25,
                "product_block_reach": 0.22,
                "relation": "广告来客在该落地页接不住，与全站留资率下跌一致",
                "min_uv_ok": True,
            },
        ],
        notes=["此卡可直接填入 AnomalyPoint 字段，仍不是根因"],
    )


def _pack_timeseries(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    metric = filters.get("metric") or "ads_x_cnc_bounce"
    series_map = fx.get("timeseries") or {}
    key = metric if metric in series_map else "ads_x_cnc_bounce"
    values = series_map.get(key) or []
    days = int(filters.get("days") or 30)
    values = values[-days:]
    points = [{"day_offset": i - len(values) + 1, "value": v} for i, v in enumerate(values)]
    return _card(
        "lg.x.timeseries",
        fx,
        filters=filters,
        summary={
            "headline": f"{key} 近 {len(values)} 日：先升后高位（跳出先于留资恶化）",
            "direction": "down",
        },
        timeseries=points,
        notes=["用于 §7.4 时间先后：广告×页跳出抬升早于留资率跌到位"],
    )


def _pack_control_compare(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    # 固定广告看页；固定页看渠
    page = "/campaign/cnc-oem-q3"
    by_channel = [r for r in fx["channel_x_page"] if r["page_path"] == page]
    ads_pages = [r for r in fx["channel_x_page"] if r["channel"] == "ads"]
    return _card(
        "lg.x.control_compare",
        fx,
        filters=filters,
        summary={
            "headline": "固定页后仅广告差；固定广告后该活动页最差 → 更像来路×页不匹配",
            "direction": "down",
        },
        rows=[
            {"fix": "channel", "vary": "page", "channel": "ads", "rows": ads_pages},
            {"fix": "page", "vary": "channel", "page_path": page, "rows": by_channel},
        ],
        notes=["控制变量加验通过，可支撑高置信根因"],
    )


def _pack_pre_post(fx: dict[str, Any], *, filters: dict[str, Any], pack_id: str = "", **_kw: Any) -> dict[str, Any]:
    post = fx.get("post_exec_mock") or {}
    return _card(
        "lg.x.pre_post_snapshot",
        fx,
        filters=filters,
        summary={
            "headline": (
                f"Mock 复盘：广告×活动页跳出 0.52→{post.get('ads_x_cnc_bounce')}，"
                f"全站留资率→{post.get('site_lead_rate')}"
            ),
            "direction": "up",
        },
        rows=[
            {
                "metric": "ads_x_cnc_bounce",
                "before": 0.52,
                "after": post.get("ads_x_cnc_bounce"),
                "verdict": "success",
            },
            {
                "metric": "site_lead_rate",
                "before": fx["scan"]["lead_rate"]["current"],
                "after": post.get("site_lead_rate"),
                "verdict": "partial_or_success",
            },
        ],
        notes=["Phase A Mock：假设内容任务已交接并落地后的对照"],
    )

from .golden_path import run_phase_a_golden_path  # noqa: E402

