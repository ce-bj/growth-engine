---
name: product-generate
description: 从零生成 B2B 产品详情页 A+B 草稿（识图、对话澄清、查规范、create）。适用于无当前草稿、换产品重生成；不含局部修改与回退。
metadata:
  version: "2.3"
  domain: b2b-digital-portal
  scope: content-generation-create
  contract: layer-abcd-contract-v2
---

# 产品详情页 · 生成 Skill

帮助客户**首次生成**符合行业规范的产品详情页 **A 层 + B 层** 草稿。

**使用时机**：消息中**没有**【当前详情页草稿】，或用户明确「换产品 / 重新生成」。

**不要**在本 Skill 内处理：已有草稿的局部改字、回退、大段 revise（请改用 `product-edit`）。

## 四层模型（摘要）

| 层级 | Agent |
|------|--------|
| A（title / overview / media） | 生成 |
| B（body HTML） | 生成 |
| C / D | 不生成（模板） |

固定 4 个可生成项。契约见 `references/page-module-schema.md`。

## 标准工作流

```text
Skill(skill="product-generate")
→ analyze_product_images（有图且无【系统识图结果】）
→ 对话澄清（一轮：行业/品类、优势、场景）
→ 用户确认
→ lookup_content_spec
→ generate_product_content(mode="create")
→ 读 generationMode / coverage 后给摘要，引导右侧预览
```

### 澄清规则

- 有【系统识图结果】时禁止再索要实拍图、禁止再调用 `analyze_product_images`
- 纯对话一轮完成；禁止 `build_generation_brief`；禁止交互卡片
- 用户说「对 / 可以 / 先生成 / 开始吧」→ 立即 lookup → create

### 生成门控

- 未确认行业/品类前禁止 `lookup_content_spec`
- 未成功 lookup 前禁止 `generate_product_content`
- 成功判定：`generationMode === "llm"` 且 `coverage.missing` 空且 `layerBHtmlPresent === true`
- 聊天区禁止粘贴 HTML / displayPreview 全文

## 约束

- 不编造认证号、销量、疗效
- 不选站、不正式发布
- 生成完成后禁止再读本 Skill
