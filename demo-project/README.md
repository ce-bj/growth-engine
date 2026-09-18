# AI运营助手 Demo

> 上一版「点击开始演示」脚本方案已归档至同级目录 [`demo-project-old/`](../demo-project-old/README.md)。

## 启动方式（推荐：真实 Agent）

需要 **Node.js 18+**、**Python 3.10+**、**npm**。

### 1. 安装依赖

```bash
cd demo-project
npm install
pip install -r server/agent-bridge/requirements.txt
```

### 2. 配置 API Key

```bash
copy .env.server.example .env.server
```

编辑 `.env.server`，填入 `OPENAI_API_KEY`（vveai key）。默认已开启 Python Agent 模式：

```env
AGENT_PYTHON_URL=http://127.0.0.1:8790
PYTHON_AGENT_MODULE=b2b_portal_agent
OPENAI_API_KEY=你的key
```

Agent 代码位于：`../agents-workspace/ai_ops_assistant/`（主）与 `../agents-workspace/b2b_portal_agent/`（产品详情页）。

默认环境变量：`PYTHON_AGENT_MODULE=ai_ops_assistant`。

### 3. 一键启动（前端 + Node 代理 + Python Agent）

```bash
npm run dev:full
```

浏览器打开 `http://localhost:5174`，在输入框发送例如：

> 帮我发布这个产品，附件是实拍图

或点击输入框左侧 **📎 按钮上传产品图片**（最多 5 张），再输入需求发送。

左侧 **会话记录** 面板会自动保存历史对话，可新建/切换/删除会话。

将调用真实 DeepSeek-V4-Pro + 3 个 Mock 工具，并流式展示工具卡片。

---

## 运行模式

| 模式 | `.env.server` 配置 | 说明 |
|------|-------------------|------|
| **Python Agent**（推荐） | `AGENT_PYTHON_URL=http://127.0.0.1:8790` | 对接 `agents-workspace/b2b_portal_agent` |
| Mock | 留空 `AGENT_PYTHON_URL` 且不留 AgentScope ID | 离线假数据 |
| AgentScope 平台 | `AGENTSCOPE_BASE_URL` + `agent_id` + `session_id` | 对接 172.25.171.180 |

优先级：**Python Agent > AgentScope > Mock**

---

## 分步启动（调试用）

```bash
# 终端 1：Python Agent 桥接
cd demo-project
set PYTHONPATH=..;..\agents-workspace
set PYTHON_AGENT_MODULE=b2b_portal_agent
python server/agent-bridge/bridge.py

# 终端 2：Node 聊天代理
npm run dev:server

# 终端 3：前端
npm run dev
```

健康检查：

- `http://localhost:8790/health` — Python Agent
- `http://localhost:8787/health` — Node 代理（`mode: python-agent`）

---

## 项目结构

```
demo-project/
├── server/
│   ├── chat-server.js       # Node SSE 代理
│   └── agent-bridge/
│       ├── bridge.py        # Python HTTP 包装 build_agent().reply_stream()
│       └── requirements.txt
├── scripts/dev-full.js      # 一键启动
└── src/
    ├── chatClient.js        # 前端 SSE 客户端
    └── App.jsx              # 聊天 UI
```

---

## 打包部署

```bash
npm run build
```

`dist/` 为静态资源；生产环境需单独部署 `chat-server` 与 `agent-bridge`。

---

## 常见问题

**1. `missing_api_key` / 请设置 OPENAI_API_KEY**  
在 `.env.server` 填入 vveai Key 后重启 `npm run dev:full`。

**2. 工具卡片有、AI 文字很少**  
模型仍在推理，或网络到 `api.vveai.com` 不通；检查代理与 `NO_PROXY`。

**3. 识图 Mock 不生效**  
发送含「发布/产品/实拍」的消息会自动附带 `valve-*.png` 图片 URL（URL 含 `valve` 触发工业设备 Mock）。
