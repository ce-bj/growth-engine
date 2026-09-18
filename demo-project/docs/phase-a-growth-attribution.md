# 业务指标归因 · 本地 Demo

> 留资率跌 → 钉流失点 → 假设核对 → 任务说明

计算在 `growth_metrics_service`，Agent 只读 snapshot、写任务说明。

## 怎么试

1. **重启** `npm run dev:full`（加载新 Agent 模块）
2. 打开前端，发送例如：
   - `帮我分析一下为什么留资率跌了`
   - `对 site_demo_b2b 做增长诊断，给出任务说明`
3. 预期链路：主 Agent → `delegate_metrics_agent`（无感托管）→ 业务指标归因 Agent → `get_snapshot` → 必要时 `get_page_content` → 六节诊断

贯穿案例应钉到**流失点 1**，命中假设「第一屏没接住」，排除「单渠来路不对」（五渠同步变差）。

## 代码位置

- 计算服务：`agents-workspace/growth_metrics_service/`（`config/` 可改、可 diff）
- Agent：`agents-workspace/growth_attribution_agent/`
- 主 Agent 委托：`ai_ops_assistant/tools/delegate.py` → `delegate_metrics_agent`

## 已知边界

- 数字来自 mock 数据包 `site_demo_b2b`，不是真数仓
- 假设 1、2 需要对照包才能验通
- 表单曝光率 / 页面留资率 / 高价值线索占比显式记为数据缺口
