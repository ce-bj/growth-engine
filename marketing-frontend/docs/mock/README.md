# 出页向导 mock 包

给「选词 → 一页预制 → 开始生成」用。一个站、五条意图。页面先读这些文件，不要先接 GSC。

| 文件 | 是什么 |
| --- | --- |
| `pack.json` | 索引 |
| `网站档案.md` | 已填档案（生成时不再问这些） |
| `products.json` | 可勾选产品（档案只到品类） |
| `knowledge-snippets.json` | 认证/打样口径，禁止编编号 |
| `intent-candidates.json` | 待承接词 |
| `prefab-plans.json` | 每条词的预制方案 + `context_message` |

可开始生成：`int_cnc_oem`（对比/产品营销）、`int_48h_alu`（决策/留资）、`int_iso_shop`（了解/品牌）。  
不能开始、用来试硬闸：`int_hannover`（缺展位号）、`int_q4_promo`（缺折扣力度）。

开始生成：把对应 `context_message` 丢进本地第一条 chat，`/marketing/setup` 的 `page_type` 用方案里的值。本地 `backend_tools.py` 仍是中企动力电源 Mock，与本包不是同一家公司，接生成前不要混用两套事实。
