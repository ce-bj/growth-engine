# -*- coding: utf-8 -*-
"""自然月复盘：措施看哪些指标、工单怎么冻结、观察中如何挡住重复工单。

不算效果本身。效果要等观察月的完整数据到了，由体检会话对照冻结值再判。
"""
from __future__ import annotations

from typing import Any

from .metrics import SITE_KEY, Slice

REVIEW_FIELDS = (
    "track",
    "window",
    "compare",
    "absolute_as",
    "subtract_site_control",
    "skip_repeat_while_observing",
    "safety_check",
    "plain",
    "primary",
    "corroborating",
    "downstream",
    "site_control",
)


def calendar_month(period: dict[str, Any] | None) -> str | None:
    end = ((period or {}).get("current") or {}).get("end")
    if not end or len(str(end)) < 7:
        return None
    return str(end)[:7]


def next_month(ym: str) -> str:
    year, month = int(ym[:4]), int(ym[5:7])
    if month == 12:
        return f"{year + 1}-01"
    return f"{year}-{month + 1:02d}"


def observe_month_for(executed_on: str | None) -> str | None:
    """执行日落在哪个月，观察月就是下一个自然月整月。"""
    if not executed_on or len(executed_on) < 7:
        return None
    return next_month(executed_on[:7])


def trial_status(trial: dict[str, Any], current_month: str | None) -> str:
    if trial.get("verdict"):
        return "reviewed"
    observe = trial.get("observe_month") or observe_month_for(trial.get("executed_on"))
    if not current_month or not observe:
        return "observing"
    if current_month < observe:
        return "observing"
    return "due"


def trial_key(measure_id: str, target: str | None) -> tuple[str, str]:
    return (measure_id, target or "")


def merge_review(lib: dict[str, Any], measure: dict[str, Any] | None) -> dict[str, Any]:
    defaults = dict(lib.get("review") or {})
    own = dict((measure or {}).get("review") or {})
    merged = {**defaults, **own}
    for key in ("primary", "corroborating", "downstream", "site_control"):
        merged[key] = list(own.get(key) or defaults.get(key) or [])
    if "track" not in own and "track" not in defaults:
        merged["track"] = (measure or {}).get("boundary") == "确认后交接"
    return {k: merged.get(k) for k in REVIEW_FIELDS if k in merged or k in (
        "primary", "corroborating", "downstream", "site_control", "track",
    )}


def public_review(spec: dict[str, Any]) -> dict[str, Any]:
    return {
        "track": bool(spec.get("track")),
        "window": spec.get("window"),
        "compare": spec.get("compare"),
        "absolute_as": spec.get("absolute_as"),
        "subtract_site_control": spec.get("subtract_site_control"),
        "skip_repeat_while_observing": bool(spec.get("skip_repeat_while_observing")),
        "safety_check": spec.get("safety_check"),
        "plain": spec.get("plain"),
        "primary": list(spec.get("primary") or []),
        "corroborating": list(spec.get("corroborating") or []),
        "downstream": list(spec.get("downstream") or []),
        "site_control": list(spec.get("site_control") or []),
    }


def blocking_keys(trials: list[dict[str, Any]], current_month: str | None) -> set[tuple[str, str]]:
    out: set[tuple[str, str]] = set()
    for trial in trials:
        spec = trial.get("review") or {}
        if spec.get("track") is False:
            continue
        if spec.get("skip_repeat_while_observing") is False:
            continue
        if trial_status(trial, current_month) != "observing":
            continue
        out.add(trial_key(trial.get("measure_id") or "", trial.get("target")))
    return out


def _key_for_ref(ref: str, bound: dict[str, Any]) -> str | None:
    dim = ref.split("@", 1)[-1] if "@" in ref else "全站"
    mapping = {
        "全站": SITE_KEY,
        "页面": bound.get("page"),
        "渠道": bound.get("channel") or bound.get("uplift"),
        "搜索词": bound.get("keyword"),
        "渠道×页": bound.get("page"),
        "搜索词×页": bound.get("page"),
        "通道": bound.get("channel"),
        "路径": bound.get("page"),
    }
    return mapping.get(dim)


def freeze_metrics(ms: Any, spec: dict[str, Any], bound: dict[str, Any]) -> dict[str, Any]:
    refs: list[str] = []
    for group in ("primary", "corroborating", "downstream", "site_control"):
        refs.extend(spec.get(group) or [])
    frozen: dict[str, Any] = {}
    for ref in refs:
        if ref in frozen:
            continue
        key = _key_for_ref(ref, bound)
        sl: Slice | None = ms.get(ref, key) if key else None
        if sl is None and key != SITE_KEY:
            sl = ms.get(ref, SITE_KEY)
        frozen[ref] = None if sl is None else {
            "key": sl.key,
            "value": sl.value,
            "baseline": sl.baseline,
            "state": sl.state,
            "data_status": sl.data_status,
        }
    return frozen
