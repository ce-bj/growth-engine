# -*- coding: utf-8 -*-
"""假设 DSL 通用求值器。

引擎里不允许出现 ``if 假设N``。13 条假设的 when 全部走这里。
同样输入十次同样结论；证据链是算出来的，不是模型写的。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from . import store
from .locate import _brief
from .metrics import (
    SITE_KEY,
    STATE_ANOMALY,
    MetricSet,
    Slice,
    compare_value,
)

PASS = "pass"
FAIL = "fail"
INSUFFICIENT = "insufficient"

# 这些作用域表示「存在一个实体，使得 …」，按候选逐个绑定再求 OR
_BIND_DRIVERS = (
    "anomaly_keyword_page",
    "anomaly_keyword",
    "uplift_channel",
    "anomaly_detail_page",
    "anomaly_page",
    "anomaly_channel",
)


@dataclass
class Bind:
    """一次求值绑定：把「该页 / 该词 / 该渠」落到具体 key。"""

    page: str | None = None
    channel: str | None = None
    keyword: str | None = None
    keyword_page: str | None = None
    detail_page: str | None = None
    uplift: str | None = None


@dataclass
class EvalNode:
    result: str
    evidence: list[dict[str, Any]] = field(default_factory=list)
    failed_on: dict[str, Any] | None = None
    insufficient_on: dict[str, Any] | None = None


def evaluate(
    ms: MetricSet,
    locate_result: dict[str, Any],
    drill_result: dict[str, Any],
) -> list[dict[str, Any]]:
    lib = store.hypothesis_lib()
    scopes = drill_result.get("scopes") or {}
    loss_point = locate_result.get("loss_point")
    out: list[dict[str, Any]] = []
    for hyp in lib.get("hypotheses") or []:
        out.append(_eval_hypothesis(ms, hyp, scopes, loss_point))
    return out


def _eval_hypothesis(
    ms: MetricSet,
    hyp: dict[str, Any],
    scopes: dict[str, list[str]],
    loss_point: str | None,
) -> dict[str, Any]:
    in_scope = hyp.get("layer") == loss_point
    gap = _requires_gap(ms, hyp.get("requires") or [])
    if gap:
        return _pack(hyp, INSUFFICIENT, in_scope, insufficient_on=gap)

    used = _collect_scopes(hyp.get("when") or {})
    binds = _bindings(used, scopes, ms)
    if not binds:
        driver = next((d for d in _BIND_DRIVERS if d in used), None)
        return _pack(
            hyp,
            FAIL,
            in_scope,
            failed_on={
                "clause": f"scope:{driver}",
                "reason": f"没有可绑定的 {driver}，该假设的「该×」不成立",
                "actual": 0,
            },
        )

    last_fail: EvalNode | None = None
    for bind in binds:
        node = _eval_clause(hyp["when"], ms, scopes, bind)
        if node.result == PASS:
            return _pack(hyp, PASS, in_scope, evidence=node.evidence, bind=bind)
        if node.result == INSUFFICIENT:
            return _pack(hyp, INSUFFICIENT, in_scope, insufficient_on=node.insufficient_on)
        last_fail = node
    assert last_fail is not None
    return _pack(hyp, FAIL, in_scope, failed_on=last_fail.failed_on, evidence=last_fail.evidence)


def _pack(
    hyp: dict[str, Any],
    result: str,
    in_scope: bool,
    *,
    evidence: list[dict[str, Any]] | None = None,
    failed_on: dict[str, Any] | None = None,
    insufficient_on: dict[str, Any] | None = None,
    bind: Bind | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "id": hyp["id"],
        "seq": hyp.get("seq"),
        "layer": hyp.get("layer"),
        "name": hyp.get("name"),
        "result": result,
        "in_scope": in_scope,
        "measures": hyp.get("measures") or [],
        "evidence": evidence or [],
        "failed_on": failed_on,
        "insufficient_on": insufficient_on,
    }
    if bind:
        row["bound"] = {
            "page": bind.page,
            "channel": bind.channel,
            "keyword": bind.keyword,
            "keyword_page": bind.keyword_page,
            "detail_page": bind.detail_page,
            "uplift": bind.uplift,
        }
    return row


# ---------------------------------------------------------------- 绑定

def _collect_scopes(node: Any) -> set[str]:
    found: set[str] = set()
    if not isinstance(node, dict):
        return found
    if "scope" in node and isinstance(node["scope"], str):
        found.add(node["scope"].split("(")[0] if "(" in node["scope"] else node["scope"])
        inner = _inner_scope_arg(node["scope"])
        if inner:
            found.add(inner)
    for key in ("count", "content_missing"):
        if key in node and isinstance(node[key], dict):
            found |= _collect_scopes(node[key])
    for key in ("all", "any"):
        for child in node.get(key) or []:
            found |= _collect_scopes(child)
    if "not" in node:
        found |= _collect_scopes(node["not"])
    return found


def _inner_scope_arg(scope: str) -> str | None:
    if "(" in scope and scope.endswith(")"):
        return scope[scope.find("(") + 1 : -1]
    return None


def _bindings(
    used: set[str],
    scopes: dict[str, list[str]],
    ms: MetricSet,
) -> list[Bind]:
    driver = next((d for d in _BIND_DRIVERS if d in used), None)
    if driver is None:
        return [Bind()]
    keys = list(scopes.get(driver) or [])
    if not keys:
        return []
    binds: list[Bind] = []
    for key in keys:
        binds.append(_bind_from(driver, key, ms))
    return binds


def _bind_from(driver: str, key: str, ms: MetricSet) -> Bind:
    b = Bind()
    if driver == "anomaly_page":
        b.page = key
    elif driver == "anomaly_detail_page":
        b.detail_page = key
        b.page = key
    elif driver == "anomaly_channel":
        b.channel = key
    elif driver == "uplift_channel":
        b.uplift = key
        b.channel = key
    elif driver == "anomaly_keyword":
        b.keyword = key
        meta = _keyword_meta(ms, key)
        b.page = meta.get("landing")
        b.channel = meta.get("channel")
    elif driver == "anomaly_keyword_page":
        b.keyword_page = key
        kw, page = _split(key)
        b.keyword, b.page = kw, page
        meta = _keyword_meta(ms, kw)
        b.channel = meta.get("channel")
    return b


# ---------------------------------------------------------------- 子句

def _eval_clause(
    node: dict[str, Any],
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> EvalNode:
    if "all" in node:
        evidence: list[dict[str, Any]] = []
        for child in node["all"]:
            got = _eval_clause(child, ms, scopes, bind)
            if got.result != PASS:
                return got
            evidence.extend(got.evidence)
        return EvalNode(PASS, evidence=evidence)
    if "any" in node:
        fails: list[EvalNode] = []
        for child in node["any"]:
            got = _eval_clause(child, ms, scopes, bind)
            if got.result == PASS:
                return got
            if got.result == INSUFFICIENT:
                return got
            fails.append(got)
        first = fails[0] if fails else EvalNode(FAIL, failed_on={"reason": "any 为空"})
        first.failed_on = {
            "clause": "any",
            "reason": "任一子条件都不成立",
            "tried": [f.failed_on for f in fails],
        }
        return first
    if "not" in node:
        got = _eval_clause(node["not"], ms, scopes, bind)
        if got.result == INSUFFICIENT:
            return got
        if got.result == PASS:
            return EvalNode(FAIL, failed_on={"clause": "not", "reason": "否定条件实际成立", "evidence": got.evidence})
        return EvalNode(PASS, evidence=[{"clause": "not", "of": got.failed_on}])
    if "count" in node:
        return _eval_count(node, ms, scopes, bind)
    if "content_missing" in node:
        return _eval_content_missing(node, ms, scopes, bind)
    return _eval_leaf(node, ms, scopes, bind)


def _eval_leaf(
    node: dict[str, Any],
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> EvalNode:
    ref = node.get("metric")
    if not ref:
        return EvalNode(FAIL, failed_on={"reason": "子句缺少 metric", "node": node})
    slices, gap = _resolve_slices(ref, node.get("scope") or "site", ms, scopes, bind)
    if gap:
        return EvalNode(INSUFFICIENT, insufficient_on=gap)
    ok_slices = [s for s in slices if s.data_status == "ok"]
    if not ok_slices:
        return EvalNode(
            FAIL,
            failed_on={
                "clause": f"{ref}@{node.get('scope')}",
                "reason": "作用域下没有可用切片",
                "actual": 0,
            },
        )
    matched, missed = [], []
    for sl in ok_slices:
        if _leaf_match(sl, node):
            matched.append(sl)
        else:
            missed.append(sl)
    if missed:
        sl = missed[0]
        return EvalNode(
            FAIL,
            failed_on={
                "clause": _leaf_label(node),
                "ref": ref,
                "key": sl.key,
                "actual_state": sl.state,
                "actual_value": sl.value,
                "reason": _leaf_fail_reason(sl, node),
            },
            evidence=[_brief(s) for s in matched],
        )
    return EvalNode(PASS, evidence=[_brief(s) for s in matched])


def _leaf_match(sl: Slice, node: dict[str, Any]) -> bool:
    if "state" in node and not _state_match(sl.state, node["state"]):
        return False
    if any(k in node for k in ("lt", "lte", "gt", "gte", "eq")):
        if not compare_value(sl.value, node):
            return False
    return True


def _leaf_fail_reason(sl: Slice, node: dict[str, Any]) -> str:
    if "state" in node and not _state_match(sl.state, node["state"]):
        return f"期望 {node['state']}，实际 {sl.state}"
    wanted = {k: node[k] for k in ("lt", "lte", "gt", "gte", "eq") if k in node}
    return f"期望数值 {wanted}，实际 {sl.value}"


def _leaf_label(node: dict[str, Any]) -> str:
    bits = [node.get("metric", ""), node.get("scope", "")]
    if "state" in node:
        bits.append(f"state={node['state']}")
    for k in ("lt", "lte", "gt", "gte", "eq"):
        if k in node:
            bits.append(f"{k}={node[k]}")
    return " ".join(str(b) for b in bits if b)


def _eval_count(
    node: dict[str, Any],
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> EvalNode:
    spec = node["count"]
    ref = spec.get("metric")
    slices, gap = _resolve_slices(ref, spec.get("scope") or "all_channels", ms, scopes, bind)
    if gap:
        return EvalNode(INSUFFICIENT, insufficient_on=gap)
    usable = [s for s in slices if s.data_status == "ok"]
    matched = [s for s in usable if _leaf_match(s, spec)]
    n = len(matched)
    if not compare_value(n, node):
        expected = {k: node[k] for k in ("eq", "gte", "lte", "gt", "lt") if k in node}
        return EvalNode(
            FAIL,
            failed_on={
                "clause": f"count {ref} {spec.get('state', '')} {expected}".strip(),
                "actual": n,
                "keys": [s.key for s in matched],
                "usable_keys": [s.key for s in usable],
                "reason": f"计数为 {n}，不满足 {expected}",
            },
            evidence=[_brief(s) for s in matched],
        )
    return EvalNode(
        PASS,
        evidence=[{
            "clause": f"count {ref}",
            "actual": n,
            "keys": [s.key for s in matched],
            "slices": [_brief(s) for s in matched],
        }],
    )


def _eval_content_missing(
    node: dict[str, Any],
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> EvalNode:
    spec = node["content_missing"]
    ref = spec.get("metric") or "页面内容@页面"
    slices, gap = _resolve_slices(ref, spec.get("scope") or "anomaly_detail_page", ms, scopes, bind)
    if gap:
        return EvalNode(INSUFFICIENT, insufficient_on=gap)
    want = spec.get("of") or []
    missing_all: list[str] = []
    evidence: list[dict[str, Any]] = []
    for sl in slices:
        has = _content_has(sl.value)
        missing = [k for k in want if not has.get(k)]
        missing_all.extend(missing)
        evidence.append({"key": sl.key, "has": has, "missing": missing})
    n = len(set(missing_all))
    if not compare_value(n, node):
        return EvalNode(
            FAIL,
            failed_on={
                "clause": f"content_missing {want}",
                "actual": n,
                "missing": sorted(set(missing_all)),
                "reason": f"缺失 {n} 项，不满足 { {k: node[k] for k in ('gte','eq','lte') if k in node} }",
            },
            evidence=evidence,
        )
    return EvalNode(PASS, evidence=evidence)


def _content_has(value: Any) -> dict[str, bool]:
    if isinstance(value, dict):
        if isinstance(value.get("has"), dict):
            return {str(k): bool(v) for k, v in value["has"].items()}
        sections = value.get("sections") or []
        return {str(s): True for s in sections}
    return {}


def _state_match(actual: str, wanted: str) -> bool:
    if wanted == "非异常":
        return actual != STATE_ANOMALY
    return actual == wanted


# ---------------------------------------------------------------- 作用域 → 切片

def _resolve_slices(
    ref: str,
    scope: str,
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> tuple[list[Slice], dict[str, Any] | None]:
    spec = ms.dict_by_ref.get(ref)
    if spec is None:
        return [], {"ref": ref, "reason": "指标字典里没有这条"}
    keys = _scope_keys(ref, spec.get("dim") or "", scope, ms, scopes, bind)
    if keys is None:
        return [], {"ref": ref, "scope": scope, "reason": f"无法解析作用域 {scope}"}
    slices: list[Slice] = []
    for key in keys:
        sl = ms.get(ref, key)
        if sl is not None:
            slices.append(sl)
    return slices, None


def _scope_keys(
    ref: str,
    dim: str,
    scope: str,
    ms: MetricSet,
    scopes: dict[str, list[str]],
    bind: Bind,
) -> list[str] | None:
    if scope == "site":
        return [SITE_KEY]

    if scope == "anomaly_page":
        return _as_metric_keys(dim, "page", [bind.page] if bind.page else scopes.get("anomaly_page") or [])
    if scope == "anomaly_detail_page":
        keys = [bind.detail_page] if bind.detail_page else scopes.get("anomaly_detail_page") or []
        return _as_metric_keys(dim, "page", [k for k in keys if k])
    if scope == "anomaly_channel":
        keys = [bind.channel] if bind.channel else scopes.get("anomaly_channel") or []
        return _as_metric_keys(dim, "channel", [k for k in keys if k])
    if scope == "uplift_channel":
        keys = [bind.uplift] if bind.uplift else scopes.get("uplift_channel") or []
        return _as_metric_keys(dim, "channel", [k for k in keys if k])
    if scope == "anomaly_keyword":
        keys = [bind.keyword] if bind.keyword else scopes.get("anomaly_keyword") or []
        return _as_metric_keys(dim, "keyword", [k for k in keys if k])
    if scope == "anomaly_keyword_page":
        keys = [bind.keyword_page] if bind.keyword_page else scopes.get("anomaly_keyword_page") or []
        return [k for k in keys if k]

    if scope == "all_channels":
        return _all_keys(ms, ref, dim, "渠道")
    if scope == "all_pages":
        return _all_keys(ms, ref, dim, "页面")
    if scope == "all_keywords":
        return _all_keys(ms, ref, dim, "搜索词")

    if scope.startswith("channels_of("):
        pages = _bound_pages(scope, bind, scopes)
        return _composite_keys(ms, ref, left="渠道", pages=pages)
    if scope.startswith("keywords_of("):
        pages = _bound_pages(scope, bind, scopes)
        return _composite_keys(ms, ref, left="搜索词", pages=pages)
    if scope.startswith("other_keywords_of("):
        pages = _bound_pages(scope, bind, scopes)
        keys = _composite_keys(ms, ref, left="搜索词", pages=pages)
        skip = bind.keyword
        return [k for k in keys if not skip or not k.startswith(skip + "|")]
    if scope.startswith("channel_of("):
        ch = bind.channel
        if not ch and bind.keyword:
            ch = _keyword_meta(ms, bind.keyword).get("channel")
        return [ch] if ch else []
    if scope.startswith("page_of("):
        page = bind.page
        if not page and bind.keyword:
            page = _keyword_meta(ms, bind.keyword).get("landing")
        return [page] if page else []
    return None


def _bound_pages(scope: str, bind: Bind, scopes: dict[str, list[str]]) -> list[str]:
    arg = _inner_scope_arg(scope)
    if arg == "anomaly_page" and bind.page:
        return [bind.page]
    if arg == "anomaly_page":
        return list(scopes.get("anomaly_page") or [])
    if bind.page:
        return [bind.page]
    return list(scopes.get("anomaly_page") or [])


def _as_metric_keys(dim: str, kind: str, keys: list[str]) -> list[str]:
    """把绑定的实体 key 转成该指标自己的切片 key。"""
    if dim in ("全站",):
        return [SITE_KEY]
    return [k for k in keys if k]


def _all_keys(ms: MetricSet, ref: str, dim: str, want: str) -> list[str]:
    if dim == "全站":
        return [SITE_KEY]
    keys = [k for k in ms.keys_of(ref) if k != SITE_KEY]
    if dim == want or want in dim:
        return keys
    # 指标是 渠道×页 但要 all_channels：取左段去重没有意义，仍返回复合 key
    return keys


def _composite_keys(ms: MetricSet, ref: str, *, left: str, pages: list[str]) -> list[str]:
    page_set = set(pages)
    out: list[str] = []
    for key in ms.keys_of(ref):
        if "|" not in key:
            continue
        _l, page = _split(key)
        if page in page_set:
            out.append(key)
    return out


def _requires_gap(ms: MetricSet, refs: list[str]) -> dict[str, Any] | None:
    missing: list[dict[str, Any]] = []
    for ref in refs:
        slices = ms.all_of(ref)
        if not slices:
            missing.append({"ref": ref, "reason": "数据包无此指标"})
            continue
        if any(s.data_status == "ok" for s in slices):
            continue
        first = slices[0]
        if first.data_status in ("not_connected", "not_in_phase1", "missing", "page_unfetchable"):
            missing.append({"ref": ref, "data_status": first.data_status, "reason": first.gap_reason})
    if missing:
        return {"reason": "所需指标不可用", "metrics": missing}
    return None


def _split(key: str) -> tuple[str, str]:
    if "|" not in key:
        return key, ""
    left, right = key.split("|", 1)
    return left, right


def _keyword_meta(ms: MetricSet, key: str) -> dict[str, Any]:
    for item in (ms.pack.get("dimensions") or {}).get("搜索词") or []:
        if item.get("key") == key:
            return item
    return {}
