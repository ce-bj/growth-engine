# -*- coding: utf-8 -*-
"""第 1、2 步：扫描 + 三问排查树，把问题钉到某一层。

排查顺序固定（来自方法论 v3.8）：
    ① 来量掉没掉        → 访问入口
    ② 三个通过率谁先掉  → 流失点 1 / 2 / 3
    ③ 都没掉但有页破线  → 仍定位流失点 1
    ④ 结构变没变        → 并列记录，不抢落点
排除项要写全，它就是「逐条核对」里的排除依据。
"""
from __future__ import annotations

from typing import Any

from .metrics import SITE_KEY, STATE_ANOMALY, MetricSet, Slice

TRIGGER_REFS = ["留资率@全站", "留资数@全站"]
SCAN_REFS = [
    "留资数@全站",
    "留资率@全站",
    "UV@全站",
    "有效浏览率@全站",
    "转化交互率@全站",
    "留资完成率@全站",
    "秒退率@全站",
    "健康度待处理问题数@全站",
]
# 三个通过率 → 落点，顺序即漏斗顺序
PASS_RATE_CHAIN = [
    ("有效浏览率@全站", "流失点1", "进来的人没看进去"),
    ("转化交互率@全站", "流失点2", "看进去了但没动手"),
    ("留资完成率@全站", "流失点3", "动手了但没留下"),
]
# 三个通过率都没掉时的兜底页面层证据
PAGE_FALLBACK_REFS = ["落地接住率@页面", "落地停留均值@页面"]


def _brief(sl: Slice | None) -> dict[str, Any]:
    if sl is None:
        return {"state": "无数据"}
    return {
        "ref": sl.ref,
        "plain": sl.plain,
        "key": sl.key,
        "value": sl.value,
        "baseline": sl.baseline,
        "pct_change": sl.pct_change,
        "pp_change": sl.pp_change,
        "state": sl.state,
        "data_status": sl.data_status,
        "labels": sl.labels,
    }


def scan(ms: MetricSet) -> list[dict[str, Any]]:
    """第 1 步：全站变化清单。"""
    rows: list[dict[str, Any]] = []
    for ref in SCAN_REFS:
        rows.append(_brief(ms.get(ref, SITE_KEY)))
    for sl in ms.all_of("渠道UV占比@渠道"):
        rows.append(_brief(sl))
    return rows


def triggered(ms: MetricSet) -> dict[str, Any]:
    """本轮值不值得往下查。"""
    hits = [
        _brief(ms.get(r, SITE_KEY))
        for r in TRIGGER_REFS
        if (ms.get(r, SITE_KEY) or Slice(r, SITE_KEY)).state == STATE_ANOMALY
    ]
    return {"triggered": bool(hits), "on": hits}


def locate(ms: MetricSet) -> dict[str, Any]:
    """第 2 步：钉到哪一层，并写全排除项。"""
    excluded: list[dict[str, Any]] = []

    # ① 来量
    uv = ms.get("UV@全站", SITE_KEY)
    if uv and uv.state == STATE_ANOMALY:
        return {
            "loss_point": "访问入口",
            "reason": "全站 UV 掉了，问题在来量，不在站内承接",
            "evidence": [_brief(uv)],
            "excluded": excluded,
            "structure": _structure(ms),
        }
    excluded.append(
        {
            "ruled_out": "来量问题（访问入口）",
            "why": "全站 UV 没掉",
            "evidence": [_brief(uv)],
        },
    )

    # ② 三个通过率，按漏斗顺序取第一个破线的
    chain_evidence = [_brief(ms.get(ref, SITE_KEY)) for ref, _, _ in PASS_RATE_CHAIN]
    for idx, (ref, point, why) in enumerate(PASS_RATE_CHAIN):
        sl = ms.get(ref, SITE_KEY)
        if sl and sl.state == STATE_ANOMALY:
            for later_ref, later_point, _ in PASS_RATE_CHAIN[idx + 1:]:
                later = ms.get(later_ref, SITE_KEY)
                if later and later.state != STATE_ANOMALY:
                    excluded.append(
                        {
                            "ruled_out": later_point,
                            "why": f"{later_ref} 没掉",
                            "evidence": [_brief(later)],
                        },
                    )
            return {
                "loss_point": point,
                "reason": why,
                "evidence": [_brief(sl)],
                "chain": chain_evidence,
                "excluded": excluded,
                "structure": _structure(ms),
            }
        excluded.append(
            {
                "ruled_out": point,
                "why": f"{ref} 没掉",
                "evidence": [_brief(sl)],
            },
        )

    # ③ 三个通过率都没掉，但页面层有破线 → 仍定位流失点 1
    broken = [
        _brief(s)
        for ref in PAGE_FALLBACK_REFS
        for s in ms.all_of(ref)
        if s.state == STATE_ANOMALY
    ]
    if broken:
        return {
            "loss_point": "流失点1",
            "reason": "三个通过率都没掉，但有页落地接住或停留破线，按方法论仍钉流失点 1",
            "evidence": broken,
            "chain": chain_evidence,
            "excluded": [e for e in excluded if e["ruled_out"] != "流失点1"],
            "structure": _structure(ms),
        }

    return {
        "loss_point": None,
        "reason": "三层通过率与页面层都没破线，本期没有可钉的落点",
        "evidence": [],
        "chain": chain_evidence,
        "excluded": excluded,
        "structure": _structure(ms),
        "insufficient_evidence": True,
    }


def _structure(ms: MetricSet) -> dict[str, Any]:
    """④ 结构有没有变。只并列记录，不抢落点。"""
    bad = [_brief(s) for s in ms.all_of("渠道UV占比@渠道") if s.state == STATE_ANOMALY]
    return {
        "changed": bool(bad),
        "channels": bad,
        "note": "结构变差不占落点，作为并列因素交给假设核对" if bad else "各渠道占比没有明显变化",
    }
