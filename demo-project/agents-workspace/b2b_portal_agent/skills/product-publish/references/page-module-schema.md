# 产品详情页内容模块 Schema（知识库 v2 返回格式）

> 不同行业、品类的写作指引由知识库动态返回；**可生成模块固定为 4 项**（全库 `module-catalog-v2.json`）。Agent 不得写死额外板块。

## lookup_content_spec 应返回的结构（v2）

```json
{
  "specVersion": "2.0.0",
  "match": "fuzzy",
  "industryName": "工业机器人",
  "productCategory": "四足机器人",
  "industryType": "机械设备",
  "pageTemplateId": "industrial-robot-v1",
  "agentScope": "A+B-only",
  "generatableModules": [
    {
      "id": 1,
      "name": "产品名称",
      "contentLayer": "A",
      "fieldTarget": "layerA.title",
      "outputShape": "title",
      "priority": "required",
      "guidance": "单行 SEO 标题…"
    },
    {
      "id": 0,
      "name": "产品概述",
      "contentLayer": "A",
      "fieldTarget": "layerA.overview",
      "outputShape": "overview",
      "priority": "required",
      "guidance": "2–4 句总述…"
    },
    {
      "id": 5,
      "name": "产品图片说明",
      "contentLayer": "A",
      "fieldTarget": "layerA.media",
      "outputShape": "image_meta",
      "priority": "required",
      "guidance": "仅为已上传图写 alt…"
    },
    {
      "id": 100,
      "name": "产品详情",
      "contentLayer": "B",
      "fieldTarget": "layerB.body",
      "outputShape": "html_richtext",
      "priority": "required",
      "guidance": "一整段可发布 HTML…"
    }
  ],
  "industryHints": {
    "compliance": ["不得编造 CE/ISO 认证号…"],
    "suggestedTopics": ["产品规格参数表", "应用场景…"],
    "tone": "B2B 专业、简体中文",
    "htmlLayoutNote": "章节顺序由 AI 实时决定，知识库不预制 htmlOutline"
  },
  "doNotGenerate": ["C 层独立应用正文", "D 层关联产品条目"],
  "templatePrefab": {
    "catalogRef": "template-catalog-cd.json",
    "layerCApps": ["breadcrumb", "inquiry-form", "enterprise-profile"],
    "layerDBlocks": ["related-products"]
  }
}
```

## generate_product_content 应返回的结构（摘要）

```json
{
  "generationMode": "llm",
  "generationPhase": "final",
  "draftTitle": "工业机器人详情页草稿",
  "coverage": {
    "generatableTotal": 4,
    "generatableFilled": 4,
    "layerAComplete": true,
    "layerBHtmlPresent": true,
    "missing": [],
    "required": { "filled": 4, "total": 4, "ratio": "4/4" }
  },
  "independentFields": [],
  "htmlBody": { "html": "<section><h2>…</h2></section>", "outline": [] },
  "pageDraft": {
    "version": "2",
    "draftId": "draft-…",
    "templateId": "industrial-robot-v1",
    "slots": {
      "layerA.title": { "type": "title", "value": { "headline": "…" } },
      "layerA.overview": { "type": "overview", "value": "…" },
      "layerA.media": { "type": "image_meta", "value": { "caption": "…", "items": [] } },
      "layerB.body": { "type": "html_richtext", "value": { "html": "…", "outline": [] } }
    },
    "meta": { "generationMode": "llm", "generationPhase": "final" }
  }
}
```

### generationMode 枚举

| 值 | 含义 |
|----|------|
| `placeholder` | 流式中间态：占位草稿已推送 |
| `llm_partial` | 流式中间态：A 或 B 部分完成 |
| `llm` | **最终成功** |
| `fallback` | LLM 失败，保留占位内容 |

Agent 向用户宣称「已完成」时，**仅当** `generationMode === "llm"` 且 `coverage.missing` 为空。

## Agent 流程

识图 → `lookup_content_spec` → `generate_product_content`（A+B）→ 读 `generationMode` / `coverage` 自检 → 引导右侧预览 → 多轮修改。

正式行业规范数据：`knowledge/industry_specs/industry-content-spec.json`（由 `lookup.py` 加载）。

## v1 遗留字段（勿在新流程使用）

以下字段仅作历史兼容，新 Skill 与工具以 v2 为准：

- `required_modules`、`contentModules`（v1 板块清单）
- `richTextSections`（v1 多段富文本，已合并为单块 `layerB.body`）
