# industry_specs · v2 契约落地说明

> 权威文档：`agent-handoff/references/layer-abcd-contract-v2.md`

## v2 文件（本目录）

| 文件 | 用途 |
|------|------|
| `module-catalog-v2.json` | Agent 可生成模块（A×3 + B×1） |
| `template-catalog-cd.json` | C/D 预制组件注册（Agent 不生成） |
| `module-catalog.json` | **v1 遗留**，迁移完成后废弃 |
| `industry-content-spec.json` | **待瘦身**：各行业仅保留 `industryHints`，不再列 10+ B 子模块 |

## 实现顺序

1. `lookup.py` 返回 v2 结构（`generatableModules` + `industryHints`）
2. `content_llm` / `page_draft` 输出 `ProductPageDraft v2`
3. 前端 `html-sanitizer-policy.json` + DOMPurify 渲染 `layerB.body`
