# Growth · 营销增长工作台

本目录按子项目收口。工作台外壳在 `workbench/`，四个智能体各自独立目录。

## 目录

```
Growth/
├── workbench/              增长工作台外壳（Vite，端口 5176）
├── demo-project/           数字门户 + AI 运营助手智能体（端口 5174）
├── vis-analysis/           访客行为分析智能体（端口 5177）
├── marketing-frontend/     智能营销页智能体（端口 5186）
├── content-console/        内容发布智能体（静态 HTML，端口 5178）
├── agents-workspace/       增长指标服务 / 归因 Agent / 运营助手
└── docs/                   交接、PRD、策略
```

工作台 iframe 默认地址：

| 模块 | 地址 |
|------|------|
| AI 访客行为分析 | `http://127.0.0.1:5177/` |
| AI 智能营销页 | `http://127.0.0.1:5186/` |
| AI 内容运营 | `http://127.0.0.1:5178/?embed=1` |

可用环境变量覆盖：`VITE_VISITOR_ANALYSIS_URL`、`VITE_MARKETING_AGENT_URL`、`VITE_CONTENT_AGENT_URL`。

## 本地启动（前端 + 后端一条命令）

在 `Growth` 目录下：

```bash
python3 scripts/run_intranet.py
```

Windows：

```powershell
python scripts/run_intranet.py
```

缺 `node_modules` 时会自动 `npm install`。端口被旧进程占用时加 `--force`。不启 Python Agent 桥加 `--skip-bridge`（chat-server 仍会起）。

| 角色 | 服务 | 地址 |
|------|------|------|
| 前端 | 工作台 | http://127.0.0.1:5176/ |
| 前端 | 数字门户 / 运营助手页 | http://127.0.0.1:5174/ |
| 前端 | 访客行为分析 | http://127.0.0.1:5177/ |
| 前端 | 智能营销页 | http://127.0.0.1:5186/ |
| 后端 | chat-server | http://127.0.0.1:8787/health |
| 后端 | agent-bridge | http://127.0.0.1:8790/health |

打开 http://127.0.0.1:5176/

内网原型打包：

```powershell
python scripts/pack_intranet.py
python scripts/upload_intranet.py
```

打包前请分别 `vite build`，工作台建议带上内网路径：

```
VITE_VISITOR_ANALYSIS_URL=/vis-analysis/ VITE_MARKETING_AGENT_URL=/marketing/
```
