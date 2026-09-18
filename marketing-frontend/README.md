# AI 营销落地页前端

React 19 + TypeScript + Vite 6 的营销落地页交互原型。包含对话创建、12 个模板、公共组件编辑、资料补充、网站检测交互、推广位置与客服消息预览、发布版本、效果页及跨 Agent 意图任务导入。

当前入口为 `src/App.tsx` → `src/pages/studio/MarketingStudio.tsx`。当前 Studio 使用前端 Mock，可以独立运行，无需后端、模型服务、API Key 或环境变量。

## 环境要求

- Node.js 22，仓库提供 `.nvmrc`。
- npm；仓库包含 `package-lock.json`，使用 `npm ci` 安装依赖。
- 现代浏览器。

本次构建环境：Node.js 22.13.0、npm 10.9.2。

## 安装与启动

终端进入本 README 所在目录。若使用 nvm，可先运行 `nvm use`。

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

浏览器打开 **http://127.0.0.1:5186/**。终端按 `Ctrl+C` 停止。

`--strictPort` 避免端口占用时自动切换。若 5186 已被另一实例占用，继续访问已有实例，或停止该实例后再启动。也可指定其他端口，但浏览器草稿按访问源隔离，不会自动出现在新端口。

直接运行 `npm run dev` 使用 Vite 配置中的默认端口 5173；上述命令固定为当前原型使用的 5186。

## 构建与预览

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4186 --strictPort
```

构建先进行 TypeScript 检查，再生成 `dist/`。生产构建预览地址为 **http://127.0.0.1:4186/**。预览仍然是 Mock 原型，不会连接真实发布和 Agent 服务。

## 体验主要流程

1. 在历史页面列表新建页面，输入需求并选择模板或自定义组件。
2. 生成首版，在对话或画布中编辑；从缺口提示进入“内容验证”。
3. 使用电脑、平板、手机预览，查看网站检测报告。
4. 配置链接与推广位置；智能客服推送在客服对话预览中查看。
5. 发布后查看效果与发布版本，或从历史列表继续编辑。

跨 Agent 流程：点击顶部“导入意图”，选择 [意图示例 JSON](docs/skills/marketing-intent-handoff/references/intent.example.json)，查看摘要后点击“导入并运行”。示例演示自动生成、检测及本地发布。相同站点与 requestId 会返回已有任务；需要另一任务时修改 requestId，建议同时使用新 slug。

## 数据与能力边界

- 草稿、历史、发布版本与压缩图片保存在浏览器 localStorage，仅属于当前访问源。
- 文档上传记录文件清单；知识检索、网站检测、自动调整和效果数据使用规则或固定样本。
- 表单提交不写入真实线索库；发布不写入线上 CMS；发布授权字段不进行真实鉴权。
- 语言配置不会自动翻译；当前原型未运行真实 Open Design 生成引擎。
- 图片每张最大 10 MB，保存压缩预览副本。浏览器空间不足时会提示保存失败。
- 清除本站点 localStorage 会丢失本地草稿和历史；不要将其作为生产存储。

`vite.config.ts` 保留了旧页面使用的 `localhost:8000` 代理配置，当前 Studio 不依赖这些接口。源码中其他旧页面和 API 文件并未全部接入当前入口。

## 项目结构

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── pages/studio/        # 当前工作台、模板、编辑、发布与 Agent 交互
│   └── components/ui/      # 公共 UI 控件
├── docs/
│   ├── AI营销落地页-产品设计.md
│   ├── contracts/          # 网站检测与修改任务 JSON
│   ├── skills/             # 意图交接 Skill、Schema 与示例
│   ├── reference/          # 交互参考图片
│   ├── open-design-reuse/  # 已保存的上游研究快照与许可文件
│   └── archive/            # 历史方案，不作为当前要求
├── package.json
├── package-lock.json
├── vite.config.ts
├── .nvmrc
└── .gitignore
```

## 产品及接口文档

- [文档总入口](docs/README.md)
- [统一产品设计](docs/AI营销落地页-产品设计.md)：背景、页面、Agent 架构、流程、接口和边界。
- [意图交接 Skill](docs/skills/marketing-intent-handoff/SKILL.md)
- [意图 JSON Schema](docs/skills/marketing-intent-handoff/references/intent.schema.json)
- [网站检测请求](docs/contracts/website-audit.request.json)、[检测结果](docs/contracts/website-audit.response.json)、[生成调整任务](docs/contracts/generation-adjustment.request.json)

文档已随前端包含，链接使用相对路径，可整体移动。`docs` 是交付时的文档快照；若继续在父工程 `document/` 维护产品文档，需同步更新此目录后再交付。

## Git 与交付

本目录使用已有的独立 Git 仓库。源码、锁文件、启动配置和配套文档纳入版本管理；`node_modules`、`dist`、缓存、本地环境文件及系统文件不纳入后续提交。

```bash
git status
git log -5 --oneline
```

现有历史曾跟踪依赖和构建产物，本次仅从当前索引移除，保留本地文件并不改写历史。未配置远程仓库；如需推送，应先设置目标 remote。

交付使用 `marketing-frontend.zip`，包含源码、锁文件、启动配置和配套文档，不包含 Git 历史、依赖和构建产物。用户解压后进入 `marketing-frontend` 目录运行：

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

打开 http://127.0.0.1:5186/ 即可使用，无需安装 Git 或启动后端。
