# 本地 Agent 开发工作区

基于 **AgentScope 2.x 源码** 在本地编写和调试 Agent。

## 目录结构

```
outputs/
├── agentscope/                  # AgentScope 官方源码 + .venv
├── agents-workspace/
│   ├── ai_ops_assistant/        # ★ 主 Agent（Supervisor）
│   ├── b2b_portal_agent/        # ★ 产品详情页 Agent（Specialist）
│   ├── growth_attribution_agent/# ★ 业务指标归因 Agent（读 snapshot，不算数）
│   └── growth_metrics_service/  # ★ 指标数据服务（59 指标 / 13 假设，无 LLM）
├── product_detail_page_agent/   # 旧版（demo 当前默认对接）
└── demo-project/                # 前端 Demo + Node/Python 桥接
```

## 一键激活环境（PowerShell）

```powershell
cd C:\Users\范勇健\.qoderwork\workspace\mqaotdz1p13gu04b\outputs\agentscope
.\.venv\Scripts\Activate.ps1

$root = "C:\Users\范勇健\.qoderwork\workspace\mqaotdz1p13gu04b\outputs"
$env:PYTHONPATH = "$root;$root\agents-workspace"

# 可选：从 demo-project 加载 API Key
$envFile = "$root\demo-project\.env.server"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }
  }
}
```

## 验证安装

```powershell
python agents-workspace\verify_env.py
```

## 运行

```powershell
# 主 Agent
python -m ai_ops_assistant.agent   # 若无 __main__，用 build_agent 脚本 / demo bridge

# 产品详情页 Agent（可直连调试）
python -m b2b_portal_agent.agent
```

## 多 Agent 说明（方案 B）

| 组件 | 路径 |
|------|------|
| 主 Agent | `ai_ops_assistant/` → `delegate_product_detail_agent` 等 |
| 产品详情页 Agent | `b2b_portal_agent/` → generate / edit Skills |
| 设计说明 | `demo-project/docs/multi-agent-scheme-b-design.md` |

## `b2b_portal_agent` 说明

> **完整架构文档（产品 + 研发）**：[`../agent-handoff/B2B_PORTAL_AGENT_GUIDE.md`](../agent-handoff/B2B_PORTAL_AGENT_GUIDE.md)

| 组件 | 路径 |
|------|------|
| Agent 入口 | `b2b_portal_agent/agent.py` → `build_agent()` |
| Tools | `tools/` — 识图 / 查规范 / 搜行业 / 生成 / patch / restore |
| Skill | `skills/product-generate`、`skills/product-edit`（`product-publish` 为兼容入口） |
| 知识库 v2 | `knowledge/industry_specs/` + `knowledge/lookup.py` |

对外接口（与 demo bridge 兼容）：

```python
from ai_ops_assistant import AGENT_NAME, build_agent  # 默认 Bridge 入口

agent = build_agent()
async for evt in agent.reply_stream(user_msg):
    ...
```

## 注入行业规范

将 JSON 放入 `b2b_portal_agent/knowledge/industry_specs/`：

- `_default.json` — 通用兜底（已内置）
- `工业设备.json` — 按行业
- `工业设备_离心泵.json` — 按行业+品类（文件名经 slug 处理）

`query_industry_page_spec` 会按优先级加载，后续可替换为真实 RAG。

## 与 demo-project 联调

`.env.server`：

```env
PYTHON_AGENT_MODULE=ai_ops_assistant
PRODUCT_DETAIL_AGENT_MODULE=b2b_portal_agent
```

然后 `npm run dev:full`。

## 参考

- AgentScope 示例：`agentscope/examples/long_term_memory/mem0/oss_demo.py`
- 官方文档：https://doc.agentscope.io/
