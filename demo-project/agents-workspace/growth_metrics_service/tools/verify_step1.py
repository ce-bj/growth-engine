# -*- coding: utf-8 -*-
"""第一步验收：扫描 + 定位。

期望：UV 持平 → 有效浏览率异常 → 钉流失点 1；
     转化交互率、留资完成率作为排除项写全；渠道结构没变。
"""
from __future__ import annotations

import io
import json
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from growth_metrics_service.engine import MetricSet, locate, scan, triggered  # noqa: E402
from growth_metrics_service.engine.metrics import SITE_KEY, STATE_ANOMALY  # noqa: E402

SITE = "site_demo_b2b"


def row(d: dict) -> str:
    pc = d.get("pct_change")
    pct = f"{pc * 100:+.1f}%" if isinstance(pc, (int, float)) else "—"
    val, base = d.get("value"), d.get("baseline")
    fmt = (lambda x: f"{x:.4g}" if isinstance(x, (int, float)) else str(x))
    tag = "" if d.get("data_status") == "ok" else f"  [{d.get('data_status')}]"
    lab = f"  ({'; '.join(d['labels'])})" if d.get("labels") else ""
    key = d.get("key") or ""
    name = d.get("ref", "") if key in ("", SITE_KEY) else f"{d.get('ref','')} · {key}"
    return f"  {name:<40} {fmt(val):>9} ← {fmt(base):<9} {pct:>8}  {d.get('state')}{tag}{lab}"


def main() -> None:
    ms = MetricSet(SITE)
    print(f"站点 {SITE} · 周期 {ms.pack['period']['current']['start']} ~ "
          f"{ms.pack['period']['current']['end']}（{ms.period_days} 天）")
    print(f"案例：{ms.pack['case_note']}\n")

    print("【第 1 步 扫描】")
    for d in scan(ms):
        print(row(d))

    trig = triggered(ms)
    print(f"\n触发下钻：{trig['triggered']}  依据：{[h['ref'] for h in trig['on']]}")

    loc = locate(ms)
    print(f"\n【第 2 步 定位】落点 = {loc['loss_point']}")
    print(f"  理由：{loc['reason']}")
    for e in loc["evidence"]:
        print(row(e))
    print("\n  排除项：")
    for ex in loc["excluded"]:
        ev = ex["evidence"][0] if ex["evidence"] else {}
        pc = ev.get("pct_change")
        pct = f"{pc * 100:+.1f}%" if isinstance(pc, (int, float)) else "—"
        print(f"    - 排除 {ex['ruled_out']:<12} 因为 {ex['why']}（{pct}，{ev.get('state')}）")
    print(f"\n  结构：{loc['structure']['note']}")

    print("\n【渠道层 · 有效浏览率】")
    for sl in ms.all_of("有效浏览率@渠道"):
        print(row(sl.as_dict()))
    print("\n【页面层 · 落地接住率】")
    for sl in ms.all_of("落地接住率@页面"):
        print(row(sl.as_dict()))

    gaps = ms.data_gaps()
    print(f"\n【数据缺口】{len(gaps)} 条")
    for g in gaps:
        print(f"  - {g['ref']:<24} {g['data_status']:<16} {g['reason']}  可用切片 {g['usable_keys']}")

    # ---- 断言
    checks = [
        ("UV 持平", ms.get("UV@全站", SITE_KEY).state == "持平"),
        ("有效浏览率异常", ms.get("有效浏览率@全站", SITE_KEY).state == STATE_ANOMALY),
        ("转化交互率持平", ms.get("转化交互率@全站", SITE_KEY).state == "持平"),
        ("留资完成率持平", ms.get("留资完成率@全站", SITE_KEY).state == "持平"),
        ("留资率异常（北极星）", ms.get("留资率@全站", SITE_KEY).state == STATE_ANOMALY),
        ("落点 = 流失点1", loc["loss_point"] == "流失点1"),
        ("排除了流失点2/3", {e["ruled_out"] for e in loc["excluded"]} >= {"流失点2", "流失点3"}),
        ("五渠有效浏览率全异常",
         sum(1 for s in ms.all_of("有效浏览率@渠道") if s.state == STATE_ANOMALY) == 5),
        ("只有主力型号页破线",
         [s.key for s in ms.all_of("落地接住率@页面") if s.state == STATE_ANOMALY]
         == ["/products/cnc-6061-bracket"]),
        ("留资数落死档并标注",
         any("死档" in lab for lab in ms.get("留资数@全站", SITE_KEY).labels)),
    ]
    print("\n【验收】")
    ok = True
    for name, passed in checks:
        print(f"  {'PASS' if passed else 'FAIL'}  {name}")
        ok = ok and passed
    print("\n结果：" + ("全部通过" if ok else "有未通过项"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
