# Demo · 方案 B 多 Agent 设计（本地原型）

> 状态：已按本文落地第一期  
> 范围：仅 `demo-project` + `agents-workspace` 本地原型，≠ 测试/生产 opsclaw

## 目标

将原「单 Agent 包办产品详情」升级为：

- **主 Agent（AI 运营助手）**：意图路由、委托、汇总、确认闸门
- **产品详情页 Agent**：生成 + 修改合一；内部用 Skill 区分
- 其余子 Agent：本期仅占位（业务指标 / 营销页 / 站点内容）

## 目录

```
agents-workspace/
├── ai_ops_assistant/          ← 主 Agent（Supervisor）
│   ├── agent.py
│   ├── prompts.py
│   ├── pending_msg.py         ← Bridge 注入本轮 UserMsg
│   ├── session_registry.py    ← 会话级子 Agent 复用
│   └── tools/delegate.py      ← delegate_* 工具
└── b2b_portal_agent/          ← 产品详情页 Agent（Specialist）
    ├── skills/product-generate/
    └── skills/product-edit/
```

Bridge：`PYTHON_AGENT_MODULE=ai_ops_assistant`；草稿/识图会话态仍绑在 `b2b_portal_agent` 工具上。

## 委托与 SSE

主 Agent 调用 `delegate_product_detail_agent` 时：

1. 取出 Bridge 注入的本轮 `UserMsg`
2. `reply_stream` 跑产品详情页 Agent
3. 将子 Agent 的 `TOOL_RESULT_TEXT_DELTA`（含 `GEN_PROGRESS` / `page_draft`）透传到主工具流
4. Bridge 现有解析逻辑继续驱动右侧预览

## Skill 路由（产品详情页 Agent）

| Skill | 场景 |
|-------|------|
| `product-generate` | 无草稿：澄清 → lookup → create |
| `product-edit` | 有草稿：patch / revise / restore |

## 非目标（本期）

- 真并行多子 Agent 同轮改多页
- 业务指标 / 营销页 / 站点内容真实实现
- 与 opsclaw 生产 Skill 同步
