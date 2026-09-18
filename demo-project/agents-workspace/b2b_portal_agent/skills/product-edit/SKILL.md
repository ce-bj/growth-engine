---
name: product-edit
description: 基于已有 pageDraft 修改产品详情页（patch 局部、revise 大段、restore 回退）。适用于消息含【当前详情页草稿】或用户要求改标题/章节/撤销。
metadata:
  version: "2.3"
  domain: b2b-digital-portal
  scope: content-generation-edit
  contract: layer-abcd-contract-v2
---

# 产品详情页 · 修改 Skill

在**已有详情页草稿**上做多轮修订。修改必须以【当前详情页草稿】的 `slots` 为准。

**使用时机**：消息含【当前详情页草稿】，或用户说「改一下」「回退」「撤销」。

**不要**在本 Skill 内处理：无草稿的首发全量生成（请用 `product-generate`）。换产品视为重新生成。

## 修改路由（硬性）

| 用户意图 | 工具 |
|----------|------|
| 回退 / 撤销 / 上一版 | `restore_page_draft(version=-1)`；**禁止** patch 或 revise 模拟撤销 |
| 改某一 h2 章节文字/颜色/样式 | `patch_page_draft`；**禁止**全量 create |
| 改 A 层单字段 | `patch_page_draft`（`layerA.title` / `overview`） |
| 多章节或整段 B 语义重写 | `generate_product_content(mode="revise", current_draft=草稿JSON)` |
| 换产品 | 转 `product-generate` 全流程 |

有【草稿版本历史】且用户要回退时：**必须** restore。

## 工作流

```text
Skill(skill="product-edit")
→ 判断意图
→ restore / patch / revise
→ 读工具 JSON（patchApplied / generationMode / coverage）
→ 聊天区摘要 + 引导右侧预览
```

### patch 注意

- `replace_section_html` 的 `html` **勿含**与 `section_heading` 同名的 `<h2>`
- 同轮对同一 `section_heading`+`action` 重复 patch 可能被护栏拒绝

### revise 注意

- 必须传入完整 `current_draft`（【当前详情页草稿】）
- 不要用 revise 做「撤销」

## 约束

- 禁止未读草稿就全量 create 覆盖用户手改
- 禁止选站与正式发布 API
- 完成后禁止再读本 Skill
