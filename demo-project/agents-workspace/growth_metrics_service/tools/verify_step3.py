# -*- coding: utf-8 -*-
"""第三步验收：Agent 工具只读 snapshot；pending 可写入且不入库。"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from growth_metrics_service.api import (  # noqa: E402
    get_metric_detail as api_get_metric_detail,
    get_snapshot,
    propose_hypothesis,
)
from growth_metrics_service.engine.store import CONFIG_DIR  # noqa: E402
from growth_attribution_agent.agent import AGENT_NAME  # noqa: E402
from growth_attribution_agent.tools import (  # noqa: E402
    get_metric_detail,
    get_page_content,
    get_snapshot as tool_get_snapshot,
    propose_hypothesis as tool_propose,
)


def main() -> None:
    snap = get_snapshot("site_demo_b2b")
    passed = [h for h in snap["hypotheses"] if h["result"] == "pass"]
    print(f"Agent 名：{AGENT_NAME}")
    print(f"snapshot 假设通过：{[h['id'] for h in passed]}")
    print(f"任务数：{len(snap['tasks'])}")

    # 工具签名能 import；同步跑 api 侧 propose
    before = json.loads((CONFIG_DIR / "hypothesis_lib.json").read_text(encoding="utf-8"))
    n_before = len(before["hypotheses"])
    proposed = propose_hypothesis(
        name="测试候选：列表页筛选器把型号藏起来了",
        layer="流失点1",
        when_text="落地接住率异常且列表页筛选点击升高、详情页到达率下降",
        how_to_verify="看详情页到达率@全站 与 未转化页出口率@页面",
        metrics_needed=["详情页到达率@全站", "未转化页出口率@页面"],
        site_id="site_demo_b2b",
        note="verify_step3 自动提议，测完删除",
    )
    after = json.loads((CONFIG_DIR / "hypothesis_lib.json").read_text(encoding="utf-8"))
    n_after = len(after["hypotheses"])
    pending_path = Path(proposed["path"])
    print(f"pending 写入：{pending_path.name}  status={proposed['status']}")
    print(f"假设库条数变化：{n_before} → {n_after}（应不变）")

    fuzzy = api_get_metric_detail("帮我查路径UV啊")
    swapped = api_get_metric_detail("UV@路径")
    exact_name = api_get_metric_detail("路径UV")
    wrong_dim = api_get_metric_detail("UV@页面")

    checks = [
        ("默认站点数据包存在", snap["site_id"] == "site_demo_b2b"),
        ("Agent 工具模块可导入", tool_get_snapshot is not None and tool_propose is not None),
        ("get_metric_detail / get_page_content 可导入", get_metric_detail and get_page_content),
        ("提议落入 pending", pending_path.exists() and proposed["status"] == "pending_review"),
        ("source=model", proposed["payload"]["source"] == "model"),
        ("未自动入库", n_before == n_after == 13),
        ("首屏任务带交接提示词", any(
            t.get("measure_id") == "M-改产品详情-首屏前移"
            and (t.get("handoff_prompt") or "").startswith("帮我修改产品")
            for t in snap["tasks"]
        )),
        ("模糊「帮我查路径UV啊」解析到路径UV@路径",
         fuzzy.get("ok") and fuzzy.get("ref") == "路径UV@路径" and len(fuzzy.get("slices") or []) >= 1),
        ("误拼 UV@路径 解析到路径UV@路径",
         swapped.get("ok") and swapped.get("ref") == "路径UV@路径"),
        ("简称路径UV 有切片",
         exact_name.get("ok") and (exact_name.get("slices") or [])[0].get("value") is not None),
        ("UV@页面 不空返回，给出候选",
         (not wrong_dim.get("ok")) and any(
             c.get("ref") in ("UV@全站", "UV@渠道") for c in (wrong_dim.get("candidates") or [])
         )),
    ]
    # 清掉测试文件，避免污染
    pending_path.unlink(missing_ok=True)

    print("\n【验收】")
    ok = True
    for name, passed_flag in checks:
        print(f"  {'PASS' if passed_flag else 'FAIL'}  {name}")
        ok = ok and passed_flag
    print("\n结果：" + ("全部通过" if ok else "有未通过项"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
