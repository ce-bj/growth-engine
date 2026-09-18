---
name: product-publish
description: （兼容入口）产品详情页生成与修改总览。优先改用 product-generate（首发）或 product-edit（有草稿修改）。
metadata:
  version: "2.3"
  domain: b2b-digital-portal
  scope: content-generation-and-preview-ab-only
  deprecated_prefer:
    - product-generate
    - product-edit
---

# 产品详情页 Skill（兼容总览）

本 Skill 为 **v2.3 兼容入口**。请按场景选择：

| 场景 | 应读 Skill |
|------|------------|
| 无草稿 / 换产品首发 | `Skill(skill="product-generate")` |
| 有【当前详情页草稿】修改/回退 | `Skill(skill="product-edit")` |

读完对应 Skill 后按其中工具路由执行；**不要**在本总览停留重复调用。

详细契约见 `references/page-module-schema.md`。
