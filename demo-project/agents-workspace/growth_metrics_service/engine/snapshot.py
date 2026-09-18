# -*- coding: utf-8 -*-
"""组装 AttributionSnapshot：扫描 + 定位 + 下钻 + 假设核对 + 可交接的任务说明。

任务说明一期必须落到运营助手现网 Skill 的交接提示词，不能只写「请改首屏」。
"""
from __future__ import annotations

import re
from typing import Any

from . import store
from .drill import drill
from .evaluator import PASS, evaluate
from .locate import locate, scan, triggered
from .metrics import MetricSet
from .review import (
    blocking_keys,
    calendar_month,
    freeze_metrics,
    merge_review,
    public_review,
    trial_key,
    trial_status,
)


def build_snapshot(site_id: str) -> dict[str, Any]:
    ms = MetricSet(site_id)
    loc = locate(ms)
    dr = drill(ms, loc)
    hyps = evaluate(ms, loc, dr)
    bound = bind_tasks(ms, dr, hyps)
    gaps = ms.data_gaps()
    return {
        "site_id": site_id,
        "site_label": ms.pack.get("site_label"),
        "period": ms.pack.get("period"),
        "case_note": ms.pack.get("case_note"),
        "headline": _headline(ms, loc, dr, hyps, bound, gaps),
        "scan": scan(ms),
        "triggered": triggered(ms),
        "locate": loc,
        "drill": {
            "anomaly_points": dr.get("anomaly_points"),
            "corroborating": dr.get("corroborating"),
            "cross_check": {
                k: v for k, v in (dr.get("cross_check") or {}).items()
                if k != "slices"
            },
            "scopes": dr.get("scopes"),
        },
        "hypotheses": hyps,
        "tasks": bound["tasks"],
        "observing": bound["observing"],
        "review_due": bound["review_due"],
        "skipped_repeats": bound["skipped_repeats"],
        "data_gaps": gaps,
    }


def _headline(
    ms: MetricSet,
    loc: dict[str, Any],
    drill_result: dict[str, Any],
    hypotheses: list[dict[str, Any]],
    bound: dict[str, Any],
    gaps: list[dict[str, Any]],
) -> dict[str, Any]:
    """摘要版要用的几个事实，压在最前面，避免长 JSON 被截断后模型靠猜。

    这里只做挑选，不做判断。三态、落点、假设结论都是别处算好的。
    """
    leads = ms.get("留资数@全站")
    uv = ms.get("UV@全站")
    points = drill_result.get("anomaly_points") or []
    top = points[0] if points else None
    page = top.get("key") if top else None
    content = _page_content(ms, page) if page else {}
    hit = [h for h in hypotheses if h.get("result") == PASS and h.get("in_scope")]
    also = [h for h in hypotheses if h.get("result") == PASS and not h.get("in_scope")]
    tasks = bound.get("tasks") or []
    observing = bound.get("observing") or []
    review_due = bound.get("review_due") or []
    return {
        "询盘条数": {
            "本期": leads.value if leads else None,
            "基线": leads.baseline if leads else None,
            "少了几条": (
                round(leads.baseline - leads.value)
                if leads and isinstance(leads.value, (int, float))
                and isinstance(leads.baseline, (int, float))
                else None
            ),
            "口径提醒": "；".join(leads.labels) if leads and leads.labels else "",
        },
        "访客人数": {
            "本期": uv.value if uv else None,
            "基线": uv.baseline if uv else None,
        },
        "卡在哪一步": loc.get("reason"),
        "问题页": {
            "路径": page,
            "名称": top.get("label") if top else None,
            "完整URL": _full_url(ms, page),
            "最近改版": content.get("last_redesign"),
            "当前首屏": content.get("first_screen"),
        } if page else None,
        "根因": [h["name"] for h in hit],
        "并列因素": [h["name"] for h in also],
        "可交接任务数": sum(
            1 for t in tasks if (t.get("execution") or {}).get("kind") == "skill"
        ),
        "只能人工的事项数": sum(
            1 for t in tasks if (t.get("execution") or {}).get("kind") == "display_only"
        ),
        "观察中任务数": len(observing),
        "待复盘任务数": len(review_due),
        "观察中一句话": (
            "；".join(
                f"{t.get('type') or t.get('measure_id')}（{t.get('target')}，"
                f"{t.get('observe_month')} 出结论）"
                for t in observing[:3]
            )
            or "无"
        ),
        "数据缺口条数": len(gaps),
        "数据缺口一句话": (
            "；".join(f"{g['plain'] or g['ref']}（{g['reason']}）" for g in gaps[:3])
            + ("；等" + str(len(gaps)) + " 项" if len(gaps) > 3 else "")
        ) if gaps else "无",
    }


def bind_tasks(
    ms: MetricSet,
    drill_result: dict[str, Any],
    hypotheses: list[dict[str, Any]],
) -> dict[str, Any]:
    lib = store.measure_lib()
    measures = {m["id"]: m for m in (lib.get("measures") or [])}
    current_month = calendar_month(ms.pack.get("period"))
    ledger = _classify_trials(ms.pack.get("executed_measures") or [], measures, lib, current_month)
    blocked = blocking_keys(ledger["observing"], current_month)

    tasks: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    seen: set[str] = set()
    for hyp in hypotheses:
        if hyp.get("result") != PASS or not hyp.get("in_scope"):
            continue
        bound = hyp.get("bound") or {}
        for mid in hyp.get("measures") or []:
            spec = measures.get(mid)
            if not spec:
                continue
            token = f"{mid}|{bound.get('page') or ''}|{bound.get('channel') or ''}"
            if token in seen:
                continue
            seen.add(token)
            target = bound.get("page") or bound.get("channel") or bound.get("keyword")
            review_spec = merge_review(lib, spec)
            if (
                review_spec.get("track")
                and review_spec.get("skip_repeat_while_observing")
                and trial_key(mid, target) in blocked
            ):
                skipped.append(
                    {
                        "measure_id": mid,
                        "hypothesis_id": hyp["id"],
                        "target": target,
                        "reason": "观察中，不重出同一张工单",
                    },
                )
                continue
            known = _known_slots(ms, bound, drill_result)
            slot_names = list(spec.get("slots") or [])
            slots = {name: known.get(name) for name in slot_names}
            if known.get("产品URL") and "产品URL" not in slots:
                slots["产品URL"] = known["产品URL"]
            page_type = _page_type(ms, bound.get("page") or known.get("出口页路径"))
            exe = _resolve_execution(spec.get("execution") or {}, page_type)
            cannot = exe.get("cannot") or exe.get("reason") or _skill_cannot(exe.get("skill"))
            prompt = _render_prompt(exe.get("prompt_template") or [], known)
            track = bool(review_spec.get("track"))
            tasks.append(
                {
                    "measure_id": mid,
                    "hypothesis_id": hyp["id"],
                    "type": spec.get("type"),
                    "boundary": spec.get("boundary") if exe.get("kind") != "display_only" else "仅展示",
                    "owner": spec.get("owner"),
                    "brief": spec.get("brief"),
                    "target": target,
                    "page_type": page_type,
                    "slots": slots,
                    "must_not": spec.get("must_not") or [],
                    "effect": spec.get("effect"),
                    "execution": {
                        "kind": exe.get("kind"),
                        "skill": exe.get("skill"),
                        "welcome": exe.get("welcome"),
                        "then": exe.get("then"),
                        "cannot": cannot,
                    },
                    "handoff_prompt": prompt or None,
                    "status": "proposed",
                    "review": public_review(review_spec),
                    "trial": (
                        {
                            "executed_on": None,
                            "frozen_month": current_month,
                            "observe_month": None,
                            "snapshot_before": freeze_metrics(ms, review_spec, bound),
                        }
                        if track
                        else None
                    ),
                },
            )
    return {
        "tasks": tasks,
        "observing": ledger["observing"],
        "review_due": ledger["review_due"],
        "skipped_repeats": skipped,
    }


def _classify_trials(
    trials: list[dict[str, Any]],
    measures: dict[str, dict[str, Any]],
    lib: dict[str, Any],
    current_month: str | None,
) -> dict[str, list[dict[str, Any]]]:
    observing: list[dict[str, Any]] = []
    due: list[dict[str, Any]] = []
    for raw in trials:
        spec = measures.get(raw.get("measure_id") or "")
        review_spec = merge_review(lib, spec)
        status = trial_status(raw, current_month)
        rec = {
            **raw,
            "status": status,
            "brief": raw.get("brief") or (spec or {}).get("brief"),
            "type": raw.get("type") or (spec or {}).get("type"),
            "review": public_review(review_spec),
        }
        if status == "observing":
            observing.append(rec)
        elif status == "due":
            due.append(rec)
    return {"observing": observing, "review_due": due}


_PLACEHOLDER = re.compile(r"\{([^}]+)\}")


def _known_slots(
    ms: MetricSet,
    bound: dict[str, Any],
    drill_result: dict[str, Any],
) -> dict[str, Any]:
    page = bound.get("page")
    channel = bound.get("channel") or bound.get("uplift")
    keyword = bound.get("keyword")
    content = _page_content(ms, page) if page else {}
    catch = ms.get("落地接住率@页面", page) if page else None
    uv = ms.get("UV@渠道", channel) if channel else None
    bounce = ms.get("秒退率@渠道", channel) if channel else None
    title = content.get("title")
    first_screen = content.get("first_screen")

    known: dict[str, Any] = {
        "页面路径": page,
        "出口页路径": page,
        "产品URL": _full_url(ms, page) if page else None,
        "渠道名": channel,
        "搜索词": keyword,
        "主力型号": None,
        "当前首屏内容": first_screen,
        "当前首屏文案": first_screen,
        "当前标题与首屏": " / ".join(x for x in (title, first_screen) if x) or None,
        "关键参数清单": _params(content),
        "参数当前所在位置": (
            "首屏可见" if content.get("hero_params_visible") else "首屏以下"
        ) if page else None,
        "改版时间点": content.get("last_redesign"),
        "改版前后接住率": (
            {"current": catch.value, "baseline": catch.baseline}
            if catch else None
        ),
        "本期UV": uv.value if uv else None,
        "基线UV": uv.baseline if uv else None,
        "跌幅": uv.pct_change if uv else None,
        "UV涨幅": uv.pct_change if uv else None,
        "秒退率": bounce.value if bounce else None,
        "异常关键词": keyword,
        "当前落地页": page,
        "交叉核对": (drill_result.get("cross_check") or {}).get("pattern"),
    }
    if page:
        for item in (ms.pack.get("dimensions") or {}).get("页面") or []:
            if item.get("key") == page:
                known["主力型号"] = _product_name(item.get("label"))
                break
    return known


def _full_url(ms: MetricSet, page: str | None) -> str | None:
    if not page:
        return None
    origin = (ms.pack.get("site_origin") or "").rstrip("/")
    if not origin:
        return page
    if page.startswith("http"):
        return page
    return origin + (page if page.startswith("/") else "/" + page)


def _page_type(ms: MetricSet, page: str | None) -> str | None:
    if not page:
        return None
    path = page
    origin = (ms.pack.get("site_origin") or "").rstrip("/")
    if origin and path.startswith(origin):
        path = path[len(origin):] or "/"
    for item in (ms.pack.get("dimensions") or {}).get("页面") or []:
        if item.get("key") == path:
            return item.get("page_type")
    return None


def _resolve_execution(execution: dict[str, Any], page_type: str | None) -> dict[str, Any]:
    kind = execution.get("kind") or "display_only"
    if kind == "skill_by_page_type":
        table = execution.get("by_page_type") or {}
        picked = table.get(page_type or "") or execution.get("default") or {}
        if not picked.get("kind"):
            picked = {**picked, "kind": "skill" if picked.get("skill") else "display_only"}
        return picked
    if kind == "skill":
        return execution
    return execution


def _skill_cannot(skill: str | None) -> str | None:
    if not skill:
        return None
    spec = (store.measure_lib().get("opsclaw_skills") or {}).get(skill) or {}
    return spec.get("cannot")


def _render_prompt(template: list[str], slots: dict[str, Any]) -> str:
    if not template:
        return ""
    mapping = {k: _slot_text(v) for k, v in slots.items()}
    if not mapping.get("产品URL") or mapping["产品URL"] == "（待补充）":
        mapping["产品URL"] = mapping.get("页面路径") or mapping.get("出口页路径") or "（待补充）"
    text = "\n".join(template)
    for key, val in mapping.items():
        text = text.replace("{" + key + "}", val)
    text = _PLACEHOLDER.sub("（待补充）", text)
    return text.strip()


def _slot_text(value: Any) -> str:
    if value is None:
        return "（待补充）"
    if isinstance(value, list):
        return "；".join(str(x) for x in value) if value else "（待补充）"
    if isinstance(value, dict):
        bits = [f"{k}={v}" for k, v in value.items()]
        return "，".join(bits)
    return str(value)


def _page_content(ms: MetricSet, page: str) -> dict[str, Any]:
    sl = ms.get("页面内容@页面", page)
    if sl and isinstance(sl.value, dict):
        return sl.value
    return {}


def _params(content: dict[str, Any]) -> list[str]:
    out = []
    if content.get("material"):
        out.append(f"材质 {content['material']}")
    if content.get("wall_thickness"):
        out.append(f"壁厚 {content['wall_thickness']}")
    return out


def _product_name(label: str | None) -> str | None:
    if not label:
        return None
    if "·" in label:
        return label.split("·")[-1].strip()
    return label
