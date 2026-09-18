# -*- coding: utf-8 -*-
"""第二步验收：下钻 + 13 条假设求值。

期望：异常点钉到主力型号详情页；交叉为五渠同步变差；
     只通过 H-L1-06；H-L1-04 因「异常渠道 ≠ 1」被排除。
"""
from __future__ import annotations

import io
import json
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from growth_metrics_service.api import get_snapshot  # noqa: E402
from growth_metrics_service.engine.review import blocking_keys, trial_status  # noqa: E402

SITE = "site_demo_b2b"
HERO = "/products/cnc-6061-bracket"


def pct(v) -> str:
    return f"{v * 100:+.1f}%" if isinstance(v, (int, float)) else "—"


def main() -> None:
    snap = get_snapshot(SITE)
    loc = snap["locate"]
    drill = snap["drill"]
    hyps = snap["hypotheses"]
    tasks = snap["tasks"]

    print(f"落点 = {loc['loss_point']}  ·  {loc['reason']}")
    print("\n【异常点】")
    for p in drill["anomaly_points"]:
        print(f"  {p['dim']:<8} {p.get('label') or p['key']}")
        print(f"           {p['ref']}  {p['value']:.4g} ← {p['baseline']:.4g}  {pct(p['pct_change'])}  {p['state']}")

    print("\n【旁证】")
    for p in drill["corroborating"]:
        labs = f"  ({'; '.join(p['labels'])})" if p.get("labels") else ""
        print(f"  {p['ref']:<20} {p.get('label') or p['key']:<28} {pct(p['pct_change'])}  {p['state']}{labs}")

    cc = drill["cross_check"]
    print(f"\n【交叉核对】{cc['pattern']}  {cc['note']}")
    print(f"  异常渠道数 {cc['anomaly_count']} / 可用 {cc['usable_count']}")
    print(f"  keys: {cc.get('anomaly_keys')}")

    print("\n【13 条假设】")
    passed = []
    for h in hyps:
        mark = {"pass": "PASS", "fail": "fail", "insufficient": "INSU"}[h["result"]]
        scope = "本层" if h["in_scope"] else "他层"
        extra = ""
        if h["result"] == "fail" and h.get("failed_on"):
            extra = f"  ← {h['failed_on'].get('reason')}"
        if h["result"] == "pass":
            extra = f"  bound={h.get('bound')}"
            passed.append(h)
        print(f"  {mark}  [{scope}] {h['id']:<10} {h['name']}{extra}")

    print("\n【任务槽位】")
    for t in tasks:
        filled = {k: v for k, v in t["slots"].items() if v not in (None, [], {})}
        empty = [k for k, v in t["slots"].items() if v in (None, [], {})]
        print(f"  {t['measure_id']}")
        print(f"    类型={t['type']}  边界={t['boundary']}  目标={t['target']}")
        print(f"    已填={json.dumps(filled, ensure_ascii=False)}")
        print(f"    待 Agent 写={empty}")
        if t.get("handoff_prompt"):
            print("    ----- 交接提示词 -----")
            print(t["handoff_prompt"])
            print("    ---------------------")

    print("\n【观察中】")
    for t in snap.get("observing") or []:
        print(f"  {t.get('measure_id')}  {t.get('target')}  → {t.get('observe_month')} 出结论")

    by_id = {t["measure_id"]: t for t in tasks}
    edit = by_id.get("M-改产品详情-首屏前移") or {}
    rollback = by_id.get("M-站外建议-评估版式回滚") or {}

    head = snap.get("headline") or {}
    print("\n【摘要版素材 headline】")
    print(json.dumps(head, ensure_ascii=False, indent=2))
    no_plain = [s["ref"] for s in snap["scan"] if not s.get("plain")]

    pass_ids = [h["id"] for h in hyps if h["result"] == "pass"]
    in_scope_pass = [h["id"] for h in hyps if h["result"] == "pass" and h["in_scope"]]
    h04 = next(h for h in hyps if h["id"] == "H-L1-04")
    h06 = next(h for h in hyps if h["id"] == "H-L1-06")
    points = [p["key"] for p in drill["anomaly_points"] if p["ref"] == "落地接住率@页面"]

    catch_frozen = ((edit.get("trial") or {}).get("snapshot_before") or {}).get("落地接住率@页面") or {}
    observing = snap.get("observing") or []
    blocked = blocking_keys(observing, "2026-08")

    checks = [
        ("落点仍是流失点1", loc["loss_point"] == "流失点1"),
        ("异常点只有主力型号页", points == [HERO]),
        ("交叉=同步变差", cc["pattern"] == "同步变差"),
        ("交叉异常渠道=5", cc["anomaly_count"] == 5),
        ("H-L1-06 通过", h06["result"] == "pass" and h06["in_scope"]),
        ("H-L1-06 绑到主力页", (h06.get("bound") or {}).get("page") == HERO),
        ("H-L1-04 不通过", h04["result"] == "fail"),
        ("H-L1-04 计数不是 1", (h04.get("failed_on") or {}).get("actual") == 5),
        ("本层通过的假设只有 06", in_scope_pass == ["H-L1-06"]),
        ("没有任何他层误通过", pass_ids == ["H-L1-06"]),
        ("产出两条措施", {t["measure_id"] for t in tasks} == {
            "M-改产品详情-首屏前移",
            "M-站外建议-评估版式回滚",
        }),
        ("首屏前移已填页面路径", tasks[0]["slots"].get("页面路径") == HERO if tasks else False),
        ("首屏任务走修改产品 Skill", (edit.get("execution") or {}).get("skill") == "product_edit_flow"),
        ("首屏交接提示词以欢迎语开头", (edit.get("handoff_prompt") or "").startswith("帮我修改产品")),
        ("首屏交接提示词带完整 URL", "https://www.demo-cnc-oem.com/products/cnc-6061-bracket" in (edit.get("handoff_prompt") or "")),
        ("首屏交接提示词写了当前首屏", "专业 CNC 加工服务商" in (edit.get("handoff_prompt") or "")),
        ("版式回滚仅展示、无提示词", rollback.get("boundary") == "仅展示" and not rollback.get("handoff_prompt")),
        ("headline 直说少了 11 条", (head.get("询盘条数") or {}).get("少了几条") == 11),
        ("headline 带完整 URL", (head.get("问题页") or {}).get("完整URL", "").startswith("https://")),
        ("headline 根因是人话、不是编号", head.get("根因") and "H-L1" not in head["根因"][0]),
        ("headline 数据缺口不为 0", head.get("数据缺口条数") == 8),
        ("headline 可交接 1 条 / 人工 1 条", head.get("可交接任务数") == 1 and head.get("只能人工的事项数") == 1),
        ("扫描每条都有人话说法", not no_plain),
        ("P75 标了还在首屏", any(
            "首屏" in lab
            for p in drill["corroborating"]
            for lab in (p.get("labels") or [])
        )),
        ("首屏任务状态是待执行", edit.get("status") == "proposed"),
        ("首屏任务冻结了对照月", (edit.get("trial") or {}).get("frozen_month") == "2026-08"),
        ("首屏复盘主指标是落地接住率", "落地接住率@页面" in ((edit.get("review") or {}).get("primary") or [])),
        ("首屏任务带执行前快照", catch_frozen.get("value") is not None),
        ("版式回滚不追踪效果", (rollback.get("review") or {}).get("track") is False and rollback.get("trial") is None),
        ("观察中有已改的询价入口", [t.get("measure_id") for t in observing] == ["M-改产品详情-补询价入口"]),
        ("观察中挡住同对象同措施", ("M-改产品详情-补询价入口", HERO) in blocked),
        ("观察中不挡住首屏前移", ("M-改产品详情-首屏前移", HERO) not in blocked),
        ("下月体检才到复盘窗", observing and trial_status(observing[0], "2026-09") == "due"),
        ("headline 写出观察中", head.get("观察中任务数") == 1),
    ]
    print("\n【验收】")
    ok = True
    for name, passed_flag in checks:
        print(f"  {'PASS' if passed_flag else 'FAIL'}  {name}")
        ok = ok and passed_flag
    print("\n结果：" + ("全部通过" if ok else "有未通过项"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
