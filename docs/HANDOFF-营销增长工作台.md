# 营销增长工作台 · 交接文档

> 交接目的：接续「业务指标归因 → 出工单 → 运营助手执行」这条线。  
> 整理日期：2026-09-02  
> 交接人：范勇健（中企动力 B2B AI 产品经理）

---

## 1. 项目背景

### 1.1 公司与产品

- **公司**：中企动力
- **核心产品**：数字门户（B2B 企业网站）
- **增长闭环**：引流（SEO / GEO / 内容）→ 进站 → 营销页/产品详情/询盘 → 留资/成交

### 1.2 工作台做什么

给门户客户一条增长链路：看数 → 发现异常 → 归因 → 出可执行工单 → 调度运营助手/工具 → 复盘。

数据看板已有留资、UV、渠道转化。本线补的是「为什么」和「接下来谁去干」。

### 1.3 使用现实（决定形态）

门户月均使用率不足 50%。账号可能是老板、运营、财务、分公司销售。获客不全靠官网；sitemap、llm.txt 这类站内技术动作，多数人无感。

所以交付分三面，一起才完整：

| 面 | 给谁 | 做什么 |
|---|---|---|
| 后台工作台 | 会登录的运营 / 对接人 | 诊断、工单、确认、看草稿 |
| 自动化 | 不会每周来对话框的人 | 到点跑计划；技术止血系统自己做 |
| 价值推送 | 老板 / 销售 / 很少登录的人 | 询盘变化、待确认的信、任务失败，推到手机 |

助手是嵌在数字门户里的运营工作台，对话推进任务，成果落在真后台页。

### 1.4 本线负责范围

方法论评审图 + 指标表（见 4.3）+ 本地诊断 Agent + Demo 工单执行。现网运营助手 Skill 仍以 `AI运营助手Skill/` 为准。

---

## 2. 核心方法论

准绳：`growth-engine/与本项目原型代码无关/outputs/attribution-flow/` 下的评审图 + 指标表（见 4.3）。七步：体检 → 定位流失点 → 下钻 → 假设验证 → 出任务说明 → 定界交接 → 复盘。

| 步 | 主题 | 核心内容 |
|---|---|---|
| ① | 指标体检 | 第一层扫描 9 项 + 30 天日序列；三态（异常/提升/持平） |
| ② | 漏斗定位 | 三问钉到访问入口或三个流失点之一 |
| ③ | 归因下钻 | 只出异常点（哪渠/哪页）；不写根因 |
| ④ | 假设验证 | 按 Excel 假设库核对；证据不足喊人 |
| ⑤ | 应对方案 | 只写任务说明，不指定调哪个 Agent |
| ⑥ | 定界交接 | 内容确认后执行 / 技术直修 / 站外仅展示 |
| ⑦ | 复盘 | 挂在下一次月度体检：执行月的下一个自然月整月 vs 工单冻结对照月；观察中不重出同一张工单 |

### 2.1 已拍板决策

| # | 决策点 | 结果 |
|---|---|---|
| 1 | 异常判定 | 规则为主 + 模型兜底 |
| 2 | 阈值分站点类型 | 一期统一 |
| 3 | 小流量 | UV<200 用宽阈值 |
| 4 | 模型兜底沉淀 | 人工标注后才入库 |
| 5 | 定时 | 每自然月跑一次 |
| 6 | 任务过期 | 下次体检时未处理则关闭 |
| 7 | 下钻维度 | 渠道/页面/设备/地域/时段，一期全做 |
| 8 | 归因深度 | 3 层 |
| 9 | 置信度 | 高/中/低 |
| 10 | 多根因 | 并列，按置信度排，不强行收敛 |
| 11 | 新假设/新措施 | 人工审核 |
| 12 | 喊人 | 证据不足挂起等人工 |
| 13 | 措施排序 | 根因置信度 → 影响面 → 成本 → 见效周期 |
| 14 | 止血/治本 | 区分；P0 至少各一个 |
| 15 | 预期效果 | 不写；复盘看执行前后实际变化 |
| 16 | P0 自动执行 | 允许（技术止血 + 低风险 + 可逆） |
| 17 | 执行失败 | 不重试，回退待确认 |
| 18 | 只出方案 | 不追踪执行效果 |
| 19 | 落地页优化 | 调营销页生成子 Agent（搜索意图落地页路由） |
| 20 | 诊断产出 | **工单**：站点、对象 URL、Skill、改法、执行档 |
| 21 | PC 点「执行」 | 新开**任务会话**；Skill 吃结构化参数；助手第一条消息接单 |
| 22 | 内容/获客停点 | 一键到草稿或名单；发布、群发在真后台页点第二下 |
| 23 | 技术止血 | 系统做完再通知（sitemap / 404 等） |
| 24 | 只出方案卡 | 无执行键 |

---

## 3. 落地架构

计算进指标服务，Agent 只读快照，工单交给运营助手 Skill。拉数一次走 `get_snapshot`。

```text
growth_metrics_service.get_snapshot(site)
  → growth_diagnosis 摘要（默认）/ 六节（追问）
  → 工单卡（自动 / 确认后执行 / 只出方案）
  → 运营助手 Skill（product_edit_flow 等）
  → 草稿/名单落真后台页 → 对外发出去另确认
```

### 3.1 代码位置（已有）

| 层 | 路径 | 职责 |
|---|---|---|
| 指标底座 | `agents-workspace/growth_metrics_service/` | 不算 LLM。改口径改 `config/*.json` |
| 归因 Agent | `agents-workspace/growth_attribution_agent/` | `get_snapshot` → 人话摘要 + tasks |
| 诊断 SOP | `…/skills/growth-diagnosis/SKILL.md` | 读快照字段纪律 + 两档输出 + 工单三档；系统提示只留人设和禁令 |
| 运营助手 Demo | `demo-project/` | 工单卡 + 一键执行会话；`npm run dev:full` → http://localhost:5174/ |

### 3.2 归因 Agent 工具

| Tool | 作用 |
|---|---|
| `get_snapshot` | 读指标服务快照（scan / locate / drill / hypotheses / tasks / headline） |
| `get_page_content` | 核对问题页首屏原文，工单里不写页上没有的参数 |
| `get_metric_detail` | 追问某指标切片 |
| `propose_hypothesis` | 库未命中时提议，待运营确认后入库 |
| `record_handoff_mock` | 记一笔内容类交接 |

一期内容任务只交接现网运营助手 Skill：`product_edit_flow` / `image_content_generation`+`product_publish` / `content_product_edit_flow` / `ai_publish_plan` / `smart_landing_page` / `find_and_replace`。

### 3.3 Demo 里一键执行（已接通）

入口：新对话点「这周询盘怎么少了」，或输入含询盘+少/掉/为什么。

| 步骤 | 行为 |
|---|---|
| 诊断会话 | 短结论 + 工单卡；只出方案无执行键 |
| 点「执行」 | `kind=scheduled`、`triggerType=task_execute` 的新任务会话 |
| 接单 | 助手「已接单」+ `product_edit_flow` 参数（site / url / patch） |
| 停点 | 草稿 + 右侧预览；诊断卡改为「查看这次执行」 |

实现：`demo-project/src/opsTasks/demo.js`、`components/OpsTaskCards.jsx`。获客「手动执行」同样进任务会话。

---

## 4. 现在干到哪儿了

### 4.1 方法论

- 评审图 v3.8：四层漏斗、三个流失点、七步、贯穿案例已走通
- 指标字典 + 假设方案库：扫描/下钻口径、三态线、根因→应对
- 落地页优化对接营销页生成子 Agent
- 诊断 Skill 版本 `0.4.0`（默认摘要，追问才出六节）

### 4.2 已能跑的代码

- `growth_metrics_service`：mock 站 `site_demo_b2b`，快照可直调
- `growth_attribution_agent`：Demo 里说「帮我看下站点留资为什么跌了」会走真实诊断（摘要/六节）
- `demo-project`：工单卡 → 任务会话 → 草稿；网站档案在聊天头

### 4.3 文档

目录：`growth-engine/与本项目原型代码无关/outputs/attribution-flow/`

| 文件 | 管什么 |
|---|---|
| `漏斗四层-方法论环绕.drawio` | 评审图 v3.8：四层漏斗 · 三个流失点 · 七步 · 全量假设与方案 · 一个案例走通 |
| `指标字典与假设方案库.xlsx` | 两张表：`指标字典`（分子/分母/最低基数/所属层）；`假设方案库`（层 → 指标组合 → 假设 → 应对） |
| `亮点经验库.xlsx` | 指标提升时出经验卡，不出工单。保护位当月生效；可复制经验要「已确认」 |

改口径先改这三份，再同步 `growth_metrics_service/config/*.json`。

---

## 5. 还有哪些没干

### 5.1 把两条 Demo 路径收成一条

| 路径 | 怎么进 | 产出 |
|---|---|---|
| 真实诊断 | 「帮我看下站点留资为什么跌了」 | 摘要/六节 + `handoff_prompt` 可复制口令 |
| 工单卡 | 「这周询盘怎么少了」 | 本地写死的卡 → 任务会话 |

下一步：快照 `tasks[]` 直接画成工单卡，点执行带 URL / 改法 / Skill 开工。边界字段对齐：快照用「确认后交接 / 仅展示 / 系统动作」，Demo 卡用 `confirm / advice`。

### 5.2 执行档补齐

- 确认后执行：内容草稿已演示；获客计划已有定时/手动跑
- 自动执行：404 / sitemap / 询盘链路尚未接到任务会话
- 只出方案：卡已有，无后续工单

### 5.3 推送

工单同一对象推到移动端：询盘变化、草稿待上线、开发信待确认。尚未做。

### 5.4 数据与知识库

- mock 包换成真神策/门户数
- `pending/` 里模型提议的假设，运营确认后写入 `hypothesis_lib.json`
- 措施映射表按现网 Skill 名对齐（详情改用 `product_edit_flow`）
- 已执行工单台账在数据包 `executed_measures[]`；观察中的同措施同对象不再出工单

### 5.5 两条分析线

| 线 | 做什么 | 入口 |
|---|---|---|
| A 网站健康度 | 6 维体检 | 工作台 scanning/report |
| B 业务指标归因 | 评审图 + 指标表 | 运营助手诊断 / 看板「分析原因」 |

结果可以进同一任务队列，分析逻辑分开。

### 5.6 图表明细与代码对齐（低优）

评审图下钻表、Excel 三态线，与 `growth_metrics_service/config/` 尚未逐条对完。

---

## 6. 相关文件位置

| 文件 | 说明 |
|---|---|
| `growth-engine/与本项目原型代码无关/outputs/attribution-flow/漏斗四层-方法论环绕.drawio` | 方法论评审图 |
| `growth-engine/与本项目原型代码无关/outputs/attribution-flow/指标字典与假设方案库.xlsx` | 指标字典 + 假设方案库 |
| `growth-engine/与本项目原型代码无关/outputs/attribution-flow/亮点经验库.xlsx` | 提升时出经验卡（仅展示，不出工单） |
| `agents-workspace/growth_metrics_service/` | 指标快照服务 |
| `agents-workspace/growth_attribution_agent/` | 归因 Agent |
| `demo-project/` | 门户助手 Demo（工单执行） |
| `demo-project/docs/任务一键执行-线框.html` | 一键执行线框 |
| `demo-project/docs/AI运营助手-界面应该长什么样-线框.html` | 助手信息架构线框 |
| `AI运营助手Skill/` | 现网 Skill 落库稿 |
| `AI运营助手Skill/AI运营助手-网站档案-空结构.md` | 网站档案模板 |
| `AI运营助手Skill/AI运营助手-定时获客任务-产品方案-评审稿.md` | 定时获客 |
| `HANDOFF.md` | AI 运营助手总交接 |

---

## 7. 给新窗口

1. 先打开 4.3 的评审图和 Excel，再读第 2.1、第 3.3 节。本地：`cd demo-project && npm run dev:full` → http://localhost:5174/ ，走「这周询盘怎么少了 → 执行」。
2. 改诊断措辞：`growth_metrics_service/config/metric_dict.json` 的 `plain`，以及快照 `headline`。
3. 改工单演示卡：`demo-project/src/opsTasks/demo.js`。
4. 下一刀：快照 `tasks[]` → 工单卡 → 结构化执行（`product_edit_flow`：URL + 局部改法）。
5. 落地页走营销页生成子 Agent；已有详情页走 `product_edit_flow`。
6. 复盘看执行前后指标变化。
