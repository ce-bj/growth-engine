# -*- coding: utf-8 -*-
"""算值、判三态、标最低基数。

这一层是确定性的：同样输入十次同样结论。规则全部来自 config/metric_dict.json，
本文件不含任何单条指标的特判分支。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from . import store

SITE_KEY = "__site__"

STATE_ANOMALY = "异常"
STATE_IMPROVE = "提升"
STATE_FLAT = "持平"
STATE_NONE = "不判"

# data_status
OK = "ok"
BELOW_BASE = "below_base"
NOT_CONNECTED = "not_connected"
NOT_IN_PHASE1 = "not_in_phase1"
PAGE_UNFETCHABLE = "page_unfetchable"
MISSING = "missing"


@dataclass
class Slice:
    """一个指标在一个切片上的判定结果。"""

    ref: str
    key: str
    value: Any = None
    baseline: Any = None
    numerator: Any = None
    denominator: Any = None
    pct_change: float | None = None
    pp_change: float | None = None
    state: str = STATE_NONE
    data_status: str = OK
    gap_reason: str = ""
    labels: list[str] = field(default_factory=list)
    hit: dict[str, Any] | None = None
    plain: str = ""

    def as_dict(self) -> dict[str, Any]:
        out = {
            "ref": self.ref,
            "plain": self.plain,
            "key": self.key,
            "value": self.value,
            "baseline": self.baseline,
            "pct_change": self.pct_change,
            "pp_change": self.pp_change,
            "state": self.state,
            "data_status": self.data_status,
        }
        if self.numerator is not None:
            out["numerator"] = self.numerator
            out["denominator"] = self.denominator
        if self.labels:
            out["labels"] = self.labels
        if self.gap_reason:
            out["gap_reason"] = self.gap_reason
        if self.hit:
            out["hit"] = self.hit
        return out


class MetricSet:
    """一个站点一个周期的全部指标判定。按 ref + key 寻址。"""

    def __init__(self, site_id: str) -> None:
        self.site_id = site_id
        self.pack = store.load_pack(site_id)
        self.dict_by_ref = store.metrics_by_ref()
        self.thresholds = store.thresholds()
        self.period_days = int(self.pack["period"]["current"].get("days") or 0)
        self.slices: dict[str, dict[str, Slice]] = {}
        self._compute()

    # ------------------------------------------------------------ 取数

    def get(self, ref: str, key: str = SITE_KEY) -> Slice | None:
        return self.slices.get(ref, {}).get(key)

    def keys_of(self, ref: str) -> list[str]:
        return list(self.slices.get(ref, {}))

    def all_of(self, ref: str) -> list[Slice]:
        return list(self.slices.get(ref, {}).values())

    def usable(self, ref: str) -> list[Slice]:
        return [s for s in self.all_of(ref) if s.data_status == OK]

    def data_gaps(self) -> list[dict[str, Any]]:
        gaps: list[dict[str, Any]] = []
        for ref, by_key in self.slices.items():
            bad = [s for s in by_key.values() if s.data_status != OK]
            if not bad:
                continue
            gaps.append(
                {
                    "ref": ref,
                    "plain": bad[0].plain,
                    "data_status": bad[0].data_status,
                    "reason": bad[0].gap_reason,
                    "keys": [s.key for s in bad],
                    "usable_keys": len(by_key) - len(bad),
                },
            )
        return sorted(gaps, key=lambda g: g["ref"])

    # ------------------------------------------------------------ 计算

    def _compute(self) -> None:
        facts = self.pack.get("facts") or {}
        unavailable = self.thresholds.get("unavailable_metrics") or {}
        forced = {
            **{r: NOT_CONNECTED for r in unavailable.get("not_connected") or []},
            **{r: NOT_IN_PHASE1 for r in unavailable.get("not_in_phase1") or []},
        }

        # 第一遍：填值，先不判态（判态可能要引用别的指标）
        for ref, spec in self.dict_by_ref.items():
            raw = (facts.get(ref) or {}).get("slices")
            if raw is None:
                self.slices[ref] = {
                    SITE_KEY: Slice(ref, SITE_KEY, data_status=MISSING,
                                    gap_reason="数据包里没有这条指标"),
                }
                continue
            if not raw:
                status = forced.get(ref, NOT_CONNECTED)
                self.slices[ref] = {
                    SITE_KEY: Slice(ref, SITE_KEY, data_status=status,
                                    gap_reason=self._unavailable_reason(spec, status)),
                }
                continue
            by_key: dict[str, Slice] = {}
            for item in raw:
                sl = self._build_slice(ref, item)
                by_key[sl.key] = sl
            self.slices[ref] = by_key

        # 第二遍：判最低基数与三态
        for ref, spec in self.dict_by_ref.items():
            plain = spec.get("plain") or ""
            for sl in self.slices.get(ref, {}).values():
                sl.plain = plain
                if sl.data_status != OK:
                    continue
                status, reason = self._check_min_base(spec, sl)
                if status != OK:
                    sl.data_status, sl.gap_reason = status, reason
                    sl.state = STATE_NONE
                    continue
                self._judge(spec, sl)

    @staticmethod
    def _unavailable_reason(spec: dict[str, Any], status: str) -> str:
        for rule in (spec.get("min_base") or {}).get("rules") or []:
            if rule.get("type") == "unavailable":
                return rule.get("reason") or status
        return spec.get("min_base", {}).get("raw") or status

    def _build_slice(self, ref: str, item: dict[str, Any]) -> Slice:
        cur = item.get("current") or {}
        base = item.get("baseline") or {}
        sl = Slice(
            ref=ref,
            key=item.get("key") or SITE_KEY,
            value=cur.get("value"),
            baseline=base.get("value"),
            numerator=cur.get("numerator"),
            denominator=cur.get("denominator"),
        )
        if isinstance(sl.value, (int, float)) and isinstance(sl.baseline, (int, float)):
            if sl.baseline:
                sl.pct_change = round((sl.value - sl.baseline) / sl.baseline, 6)
            sl.pp_change = round((sl.value - sl.baseline) * 100, 4)
        return sl

    # ------------------------------------------------------------ 最低基数

    def _check_min_base(self, spec: dict[str, Any], sl: Slice) -> tuple[str, str]:
        raw = (spec.get("min_base") or {}).get("raw") or ""
        for rule in (spec.get("min_base") or {}).get("rules") or []:
            kind = rule.get("type")
            if kind == "unavailable":
                return rule.get("status", NOT_CONNECTED), rule.get("reason") or raw
            if kind == "period_days":
                if self.period_days < rule["gte"]:
                    return BELOW_BASE, f"周期 {self.period_days} 天 < {rule['gte']} 天"
            elif kind == "denominator":
                den = sl.denominator
                if den is None or den < rule["gte"]:
                    return BELOW_BASE, f"分母 {den} < {rule['gte']}（{raw}）"
            elif kind == "prev_value":
                prev = sl.baseline
                if not isinstance(prev, (int, float)) or prev <= rule["gt"]:
                    return BELOW_BASE, f"上期 {prev} ≤ {rule['gt']}（{raw}）"
            elif kind == "self_value":
                if not isinstance(sl.value, (int, float)) or sl.value < rule["gte"]:
                    return BELOW_BASE, f"本期 {sl.value} < {rule['gte']}（{raw}）"
            elif kind == "companion":
                other = self._companion_value(rule["ref"], sl.key)
                if other is None or other < rule["gte"]:
                    return BELOW_BASE, f"{rule['ref']} = {other} < {rule['gte']}（{raw}）"
            elif kind == "page_fetch":
                if sl.value in (None, ""):
                    return PAGE_UNFETCHABLE, "抓不到该页"
        return OK, ""

    def _companion_value(self, ref: str, key: str) -> float | None:
        """按同切片取另一条指标的本期值；渠道×页这类复合键会回退到主键。"""
        by_key = self.slices.get(ref) or {}
        for candidate in self._key_candidates(key):
            sl = by_key.get(candidate)
            if sl and isinstance(sl.value, (int, float)):
                return float(sl.value)
        return None

    @staticmethod
    def _key_candidates(key: str) -> list[str]:
        out = [key]
        if "|" in key:
            out.extend(key.split("|"))
        out.append(SITE_KEY)
        return out

    # ------------------------------------------------------------ 三态

    def _judge(self, spec: dict[str, Any], sl: Slice) -> None:
        tri = spec.get("tri_state") or "full"
        judge = spec.get("judge") or {}
        if tri == "none" or not judge:
            sl.state = STATE_NONE
            self._apply_labels(spec, sl)
            return

        anomaly = judge.get("anomaly")
        if anomaly and self._eval(anomaly, sl):
            sl.state = STATE_ANOMALY
            sl.hit = {"on": "anomaly", "rule": anomaly}
            self._apply_labels(spec, sl)
            return
        if tri == "anomaly_only":
            sl.state = STATE_NONE
            self._apply_labels(spec, sl)
            return

        improve = judge.get("improve")
        if improve and self._eval(improve, sl):
            sl.state = STATE_IMPROVE
            sl.hit = {"on": "improve", "rule": improve}
            self._apply_labels(spec, sl)
            return

        sl.state = STATE_NONE if tri == "no_flat" else STATE_FLAT
        self._mark_deadband(sl)
        self._apply_labels(spec, sl)

    def _apply_labels(self, spec: dict[str, Any], sl: Slice) -> None:
        if sl.state == STATE_ANOMALY and spec.get("label_on_anomaly"):
            sl.labels.append(spec["label_on_anomaly"])
        for rule in spec.get("label_rules") or []:
            if self._eval(rule["when"], sl):
                sl.labels.append(rule["label"])

    def _mark_deadband(self, sl: Slice) -> None:
        band = self.thresholds.get("deadband") or {}
        for case in band.get("cases") or []:
            if case.get("ref") != sl.ref or sl.pct_change is None:
                continue
            rng = case.get("range") or {}
            mag = abs(sl.pct_change)
            wrong_way = (rng.get("dir") == "down" and sl.pct_change >= 0) or (
                rng.get("dir") == "up" and sl.pct_change <= 0
            )
            if wrong_way:
                continue
            if rng.get("pct_gte", 0) <= mag < rng.get("pct_lt", float("inf")):
                sl.labels.append(f"落在死档（{case['gap']}），按 {band.get('policy')} 处理")

    # ------------------------------------------------------------ 规则求值

    def _eval(self, rule: dict[str, Any], sl: Slice) -> bool:
        if "all" in rule:
            return all(self._eval(r, sl) for r in rule["all"])
        if "any" in rule:
            return any(self._eval(r, sl) for r in rule["any"])
        if "not" in rule:
            return not self._eval(rule["not"], sl)

        kind = rule.get("type")
        if kind == "pct_change":
            if sl.pct_change is None:
                return False
            moved = -sl.pct_change if rule["dir"] == "down" else sl.pct_change
            return moved > rule["gt"]
        if kind in ("abs_change_pp", "pp_change"):
            if sl.pp_change is None:
                return False
            moved = -sl.pp_change if rule["dir"] == "down" else sl.pp_change
            return moved > rule["gt"]
        if kind == "value":
            return _cmp(sl.value, rule)
        if kind == "ref_ratio":
            left = self._companion_value(rule["left"], sl.key)
            right = self._companion_value(rule["right"], SITE_KEY)
            if left is None or not right:
                return False
            return _cmp(left / right, rule)
        if kind == "companion":
            other = self._lookup(rule["ref"], sl.key)
            if other is None:
                return False
            if "state" in rule:
                return other.state == rule["state"]
            return _cmp(other.value, rule)
        if kind == "companion_pct_change":
            other = self._lookup(rule["ref"], sl.key)
            if other is None or other.pct_change is None:
                return False
            moved = -other.pct_change if rule["dir"] == "down" else other.pct_change
            return moved > rule["gt"]
        if kind == "health_high_risk":
            return bool(sl.value) and float(sl.value) > 0
        return False

    def _lookup(self, ref: str, key: str) -> Slice | None:
        by_key = self.slices.get(ref) or {}
        for candidate in self._key_candidates(key):
            if candidate in by_key:
                return by_key[candidate]
        return None


def compare_value(value: Any, rule: dict[str, Any]) -> bool:
    """数值比较：rule 里出现的 lt/lte/gt/gte/eq 必须全部成立。"""
    return _cmp(value, rule)


def _cmp(value: Any, rule: dict[str, Any]) -> bool:
    if not isinstance(value, (int, float)):
        return False
    if "lt" in rule and not value < rule["lt"]:
        return False
    if "lte" in rule and not value <= rule["lte"]:
        return False
    if "gt" in rule and not value > rule["gt"]:
        return False
    if "gte" in rule and not value >= rule["gte"]:
        return False
    if "eq" in rule and value != rule["eq"]:
        return False
    return any(k in rule for k in ("lt", "lte", "gt", "gte", "eq"))
