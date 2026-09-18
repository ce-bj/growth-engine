# industry_specs · v2 知识库说明（研发交接）

> **契约权威文档**：仓库 `agent-handoff/references/layer-abcd-contract-v2.md`  
> **lookup 返回样例**：`agent-handoff/examples/lookup-content-spec-v2.sample.json`  
> **查表实现**：上级目录 `../lookup.py`（交接包须一并提供，不能只发 JSON）

---

## 1. v2 运行时文件（必带）

`lookup.py` 在运行时**仅加载**以下 4 个 JSON：

| 文件 | 大小（约） | 用途 |
|------|------------|------|
| `module-catalog-v2.json` | 3 KB | 全库固定 **4** 个可生成模块（A×3 + B×1） |
| `industry-content-spec.json` | 256 KB | ~200 行业条目 + `industryHints`（合规、建议话题、语气） |
| `industry-type-fallback.json` | 8 KB | 7 大行业类型母版（精确/模糊未命中时回退） |
| `template-catalog-cd.json` | 2 KB | C/D 预制组件注册表（Agent **不生成**，供预览模板与门户对齐） |

### 查表逻辑摘要

```
用户 industry + product_category
  → industry-content-spec 精确/模糊匹配
  → 未命中则 industry-type-fallback（按 industryType）
  → 再未命中则默认母版
  → 合并 module-catalog-v2 + industryHints
  → 返回 v2 结构（generatableModules + pageTemplateId + doNotGenerate）
```

Python 入口：`lookup_content_spec()` / `search_agent_industries()`（见 `knowledge/lookup.py`）。

---

## 2. 本目录其他文件（交接时建议剔除）

| 文件 | 状态 | 说明 |
|------|------|------|
| `module-catalog.json` | v1 遗留 | `lookup.py` **不读取**；仅供历史对照 |
| `*.v1.bak` | 备份 | 旧版全量规范，约 1MB，**勿打包** |
| `clarification-templates.json` | legacy | 仅 `build_generation_brief` 使用；当前 Agent **未注册**该工具 |
| `index.ts` / `types.ts` | 前端产物 | Python Agent 不使用 |

---

## 3. 研发交接包（已生成）

精简交接目录（可直接 zip 发给研发）：

```
b2b_portal_agent/knowledge-rd-handoff/
└── knowledge/
    ├── lookup.py
    ├── loader.py
    ├── __init__.py
    └── industry_specs/
        ├── module-catalog-v2.json
        ├── industry-content-spec.json
        ├── industry-type-fallback.json
        ├── template-catalog-cd.json
        └── README-v2.md（本文件副本）
```

同级压缩包：`knowledge-rd-handoff.zip`（与上表内容一致）。

**接入方式**：将 `knowledge/` 目录覆盖到 `b2b_portal_agent/knowledge/`，或按你们服务的路径修改 `lookup.py` 内 `SPECS_DIR`。

---

## 4. v2 返回字段（研发必读）

| 字段 | 说明 |
|------|------|
| `specVersion` | `"2.0.0"` |
| `match` | `exact` / `fuzzy` / `type-fallback` / `default` |
| `generatableModules` | 固定 4 项，含 `fieldTarget`、`outputShape`、`guidance` |
| `industryHints` | `compliance`、`suggestedTopics`、`tone`、`htmlLayoutNote` |
| `pageTemplateId` | 预览模板 ID（Demo 默认 `industrial-robot-v1`） |
| `doNotGenerate` | C/D 层说明，Agent 不得生成 |

B 层：行业 30 模块**不**再展开为多个 API 字段，而是由 AI 将适用内容编排进**单一** `layerB.body` HTML（见 PRD §5.4）。

---

## 5. 维护与瘦身

| 操作 | 命令 / 说明 |
|------|-------------|
| 更新行业话术 | 改 `industry-content-spec.json` 中对应行业的 `industryHints` |
| 全库模块定义 | 改 `module-catalog-v2.json`（**影响所有行业，慎改**） |
| 批量瘦身脚本 | 仓库根 `agents-workspace/scripts/slim_industry_spec_v2.py`（若存在） |
| 重新生成交接包 | 运行 `knowledge/scripts/build-rd-handoff.ps1` |

---

## 6. 相关文档

| 文档 | 路径 |
|------|------|
| Agent 架构 | `demo-project/B2B_PORTAL_AGENT_GUIDE.md` §8 |
| 产品 PRD（AI-B 一期） | `demo-project/PRD.md` |
| 行业内容标准（源） | Obsidian《行业产品详情页内容结构标准》 |

*JSON 与 `lookup.py` 冲突时，以 `lookup.py` 与 `layer-abcd-contract-v2.md` 为准。*
