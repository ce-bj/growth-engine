# 指标数据分析服务 · SPEC v0.1

数据驱动的业务分析底座。**不含 LLM**，只负责算数、判三态、定位、下钻、核对假设。
业务分析 Agent（`growth_attribution_agent`）读它的产物，不重算。

来源口径：`指标字典与假设方案库.xlsx`（59 指标 / 13 假设）+ `漏斗四层-方法论环绕.drawio` v3.8。

---

## 1. 三层分工

| 层 | 内容 | 谁改 | 变更方式 |
|---|---|---|---|
| 数据层 | 指标分子分母、最低基数、本期/基线值 | 产品经理（口径） | 改代码 + 重采 4 周基线 |
| 知识层 `config/` | 假设库、措施库、阈值配置表 | 运营提 / PM 批 | 改 JSON 行，不发版 |
| 判断表达层（Agent） | 实例化、写任务说明、提候选假设、叙述答疑 | 模型 | 每轮生成 |

铁律：

- 引擎里 **不允许出现任何 `if 假设N`**。假设全部由 `evaluator.py` 通用求值。
- 模型 **不判三态、不数破线条数**；模型判断的是「破线之后意味着什么、该怎么说、该做什么」。
- 缺数显式暴露为 `data_gaps`，不静默填 0。

---

## 2. 目录

```
growth_metrics_service/
├── config/                     知识层（可 diff / 可回滚）
│   ├── metric_dict.json        59 条指标
│   ├── hypothesis_lib.json     13 条假设（声明式 when）
│   ├── measure_lib.json        措施库：任务类型 + 交接边界 + 槽位 + 复盘看哪些指标
│   └── thresholds.json         阈值档位：全局默认 + 单站覆盖
├── mock/
│   └── site_demo_b2b/          贯穿案例数据包
├── engine/
│   ├── store.py                config/ 与数据包加载（只读）
│   ├── metrics.py              算值、判三态、标最低基数
│   ├── locate.py               第 1、2 步：扫描 + 三问排查树 → 落点
│   ├── drill.py                第 3 步：下钻 → 异常点
│   ├── evaluator.py            假设 DSL 求值器
│   └── snapshot.py             组装 AttributionSnapshot
├── pending/                    候选经验待确认（链路 A 落点）
├── api.py                      Python 直调入口；预留 FastAPI 薄壳
└── tools/
    ├── import_from_xlsx.py     一次性导入指标字典，仅留档
    ├── build_mock_pack.py      构造贯穿案例数据包
    ├── verify_step1.py         第一步验收：扫描 + 定位
    └── verify_step3.py         第三步验收：pending 不入库
```

跑验收：

```powershell
$env:PYTHONPATH = "<outputs>;<outputs>\agents-workspace"
python -m growth_metrics_service.tools.verify_step1
python -m growth_metrics_service.tools.verify_step3
```

`config/*.json` 生成后即为**唯一事实源**，后续手改，不再从 xlsx 覆盖生成。

---

## 3. 指标寻址

指标名跨维度重名（`留资率` 有全站/渠道两条，`落地接住率` 有页面/渠道×页/搜索词×页三条），
所以主键是 **`ref = 名称@维度`**：

```
留资率@全站   留资率@渠道   落地接住率@渠道×页   滚动深度P75@页面
```

维度枚举：`全站 / 渠道 / 页面 / 渠道×页 / 搜索词 / 搜索词×页 / 通道 / 路径`。

所属层枚举：`扫描 / 访问入口 / 流失点1 / 流失点2 / 流失点3 / 技术侧`。

### 三态判定

`tri_state` 四挡：

| 值 | 含义 |
|---|---|
| `full` | 判异常/提升/持平 |
| `no_flat` | 只判异常/提升，不判持平（渠道UV占比） |
| `anomaly_only` | 只报异常（健康度两条） |
| `none` | 不判三态，只作计数或旁证 |

`role` 决定能否单独钉点：

| 值 | 含义 |
|---|---|
| `primary` | 可单独钉异常点 |
| `corroborating` | 旁证，只能陪跑（停留均值、P75、人均页数、站内搜索类） |
| `counting` | 计数，给别人当分子分母（有效浏览访客等） |
| `reference` | 只作对照（留资来源通道占比） |

### 判定规则原子

```jsonc
{"type": "pct_change",   "dir": "down", "gt": 0.30}   // 环比跌 >30%
{"type": "abs_change_pp","dir": "down", "gt": 2}      // 绝对跌 >2pp
{"type": "value",        "lt": 0.005}                 // 绝对值 <0.5%
{"type": "pp_change",    "dir": "down", "gt": 15}     // 跟上期比跌 >15 个点
{"type": "ratio_of",     "ref": "留资率@全站", "lt": 0.5}  // 低于全站一半
{"type": "companion",    "ref": "来路关键词点击量@搜索词", "state": "异常"}
{"all": [...]}  {"any": [...]}
```

### 最低基数

```jsonc
{"type": "prev_value",  "gt": 5}                      // 上期 ≤5 不计算
{"type": "denominator", "gte": 10}                    // 分母人数 <10 不计算
{"type": "period_days", "gte": 14}                    // 周期 <14 天不计算
{"type": "companion",   "ref": "UV@渠道", "gte": 30}   // 该渠道 UV <30 不计算
{"type": "unavailable", "reason": "未接入"}            // 一期不计算
```

不满足 → `data_status` 落到 `below_base` / `not_in_phase1` / `not_connected`，
该指标 **不参与三态、不参与假设核对**，并进 `data_gaps`。

---

## 4. 假设 DSL

一条假设 = `requires`（所需指标）+ `when`（指标组合情况）+ `measures`（应对方案）。

```jsonc
{
  "id": "H-L1-06",
  "layer": "流失点1",
  "seq": 6,
  "name": "这一页的第一屏没接住客户，客户看了上半屏就走了",
  "requires": ["落地接住率@页面", "落地停留均值@页面", "滚动深度P75@页面"],
  "when": { "all": [
    { "metric": "落地接住率@页面",   "scope": "anomaly_page", "state": "异常" },
    { "metric": "落地停留均值@页面", "scope": "anomaly_page", "state": "异常" },
    { "any": [
      { "metric": "滚动深度P75@页面", "scope": "anomaly_page", "state": "异常" },
      { "metric": "滚动深度P75@页面", "scope": "anomaly_page", "lt": 0.40 }
    ]}
  ]},
  "measures": ["M-改产品详情-首屏前移", "M-站外建议-评估版式回滚"]
}
```

### 条件节点

| 形态 | 说明 |
|---|---|
| `{metric, scope, state}` | 该切片三态等于 `异常/提升/持平`；`state: "非异常"` 表示「没有异常」 |
| `{metric, scope, lt/gt/lte/gte}` | 数值比较 |
| `{count: {metric, scope, state}, eq/gte/lte}` | 跨切片计数（「异常的渠道为 1 条」） |
| `{all: [...]}` / `{any: [...]}` / `{not: {...}}` | 组合 |

### scope 作用域

| 值 | 绑定到 |
|---|---|
| `site` | 全站 |
| `anomaly_page` | 第 3 步钉出的异常页 |
| `anomaly_channel` | 钉出的异常渠道 |
| `anomaly_keyword` | 钉出的异常搜索词 |
| `all_channels` / `all_pages` / `all_keywords` | 全体切片（配 `count` 用） |
| `channels_of(anomaly_page)` | 该异常页下的各渠道切片 |
| `keywords_of(anomaly_page)` | 落到该异常页的各搜索词切片 |

### 求值结果

每条假设返回 `pass / fail / insufficient`：

- `pass`：全部子条件成立，附逐条 `evidence`（用了哪个 ref、哪个切片、什么值）
- `fail`：附**第一条不成立的子条件**，这就是「逐条核对」里的排除依据
- `insufficient`：`requires` 里有指标处在 `data_gaps`，不算通过也不算排除

---

## 5. 输出契约 AttributionSnapshot

```jsonc
{
  "site_id": "site_demo_b2b",
  "period": { "current": "...", "baseline": "过去4周同期平均", "days": 28 },
  "headline": { "询盘条数": { "本期", "基线", "少了几条", "口径提醒" },
                "访客人数", "卡在哪一步", "问题页": { "路径", "名称", "完整URL", "最近改版", "当前首屏" },
                "根因": ["..."], "并列因素": [], "可交接任务数", "只能人工的事项数",
                "数据缺口条数", "数据缺口一句话" },
  "scan":     [ { "ref", "plain", "value", "baseline", "change", "state", "data_status" } ],
  "locate":   { "loss_point": "流失点1", "reason": "...", "excluded": [...] },
  "drill":    { "anomaly_points": [ { "dim", "key", "ref", "value", "baseline", "evidence" } ],
                "cross_check": { "同步变差": true, "note": "五渠同向，非单渠" } },
  "hypotheses": [ { "id", "name", "result", "evidence": [...], "failed_on": {...} } ],
  "tasks":    [ { "measure_id", "type", "boundary", "target", "slots",
                  "execution": { "kind", "skill", "welcome", "cannot" },
                  "handoff_prompt": "帮我修改产品\\n...",
                  "status": "proposed",
                  "review": { "track", "primary", "plain" },
                  "trial": { "executed_on", "frozen_month", "observe_month", "snapshot_before" } } ],
  "observing":[ { "measure_id", "target", "executed_on", "observe_month", "status": "observing" } ],
  "review_due":[ { "measure_id", "target", "status": "due" } ],
  "data_gaps":[ { "ref", "data_status", "reason" } ]
}
```

`tasks` 每条必须带 `execution`（走哪条现网 Skill）和 `handoff_prompt`（可复制发给运营助手的完整提示词）。
可追踪的内容任务还要带 `review`（看哪些指标）和 `trial`（出工单时冻结对照月）。
`pack.json` 的 `executed_measures[]` 是已执行工单台账。观察中的 `measure_id + target` 本期不再出同一张工单，只出现在 `observing[]`。
复盘窗口是**执行月的下一个自然月整月**，对照工单冻结的那个月；绝对数按日均，并减掉 `site_control`。效果一期整月对整月，不做任意日期切片。
一期只能落到测试/生产环境 AI 运营助手已激活 Skill，不能发明改导航、回滚版式、改客服知识库。

- `execution.kind=skill`：`handoff_prompt` 以欢迎语开头（如「帮我修改产品」），并带完整产品/文章 URL。
- `execution.kind=display_only`：`handoff_prompt` 为空，Agent 只出口头建议。
- `execution.kind=system`：只改本期分析口径。

交接边界三挡（沿用方法论）：`直接修复` / `确认后交接` / `仅展示`。

### headline 与 plain：给老板看的那一层

看 Agent 回复的是老板和运营，不是分析师，所以口径层要额外供两样东西：

- **`plain`**：`metric_dict.json` 每条指标一句人话（如 `落地接住率@页面` → 「从这一页进来的人，有多少留下来继续看」）。
  每个切片、每条 `data_gaps` 都带上，模型直接用，不用自己现编。改措辞只改 `plain`，不动代码不动 Agent。
- **`headline`**：把摘要版要用的事实挑到 JSON 最前面——少了几条询盘、卡在哪一步、哪一页、什么时候改的版、
  根因人话、几条能交接几条只能人工、数据缺口几条。

`headline` 只做**挑选**，不做判断，所以不违反「引擎不判、模型不算」。
它同时是防截断措施：快照 JSON 很长，模型上下文被截断时曾把 `data_gaps` 当成空的，
`headline.数据缺口一句话` 压在开头能挡住这类瞎猜。

---

## 6. Agent 侧接口

| 工具 | 用途 |
|---|---|
| `get_snapshot(site_id, period)` | 一次拿全量结论 |
| `get_metric_detail(ref, scope)` | 追问时取单切片时序 |
| `get_page_content(page_path)` | 读页正文，写任务说明用 |
| `propose_hypothesis(...)` | 库内全不命中时提候选，落 `pending/` |

删除 `run_phase_a_golden_path`。

---

## 7. 迭代闭环（最小版）

- **链路 A**：Agent 复盘后提候选 → `pending/hypothesis_*.json` → 运营确认 → 追加进 `hypothesis_lib.json`。
- **链路 B**：运营直接改 `config/*.json`，Git diff 可查、可回滚。

Agent 只有**提议权**，没有**入库权**。模型判定的结论必须带 `source: "model"` 标注。

---

## 8. 已知未决

- **留资数死档**：环比跌 25% 时三态都不算（异常线 >30%，持平吞掉）。
  v0.1 按「并进持平」实现，位置在 `thresholds.json → 留资数@全站.deadband`，改一行可翻。
- 假设 1、2 需要「UV 真跌」「渠道结构变差」两个对照数据包才能验通，v0.1 不覆盖。
- 表单曝光率、页面留资率、高价值线索占比现网无数据，固定落 `not_connected` / `not_in_phase1`。
