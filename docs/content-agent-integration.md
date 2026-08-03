# 内容运营板块 × Agent 生态对接设计（诊断→内容规划→素材推导→生产闭环）

> 状态：**已实现 v0.2**（2026-08-03）
> 上一轮（v0.1）只做了原型 UI + 硬编码 mock。本轮把**推导逻辑真正落地为可调用的 lib**：
> - `src/lib/knowledge.ts` → `searchKnowledge` / `resolveIntent`（知识库检索 + 意图推导 mock）
> - `src/lib/contentPlanner.ts` → `planContent`（内容规划推导：归因措施+变化 → 简报字段）
> - `src/lib/materialBudget.ts` → `deriveMaterialBudget`（模板 × searchKnowledge → 素材预算）
>
> 三者已接入 `confirmMeasure`（归因确认→建任务）与 `promoteToTask`/`submitNewTask`（任务创建→算预算）。
> 生产阶段可将 lib 替换为真实 Agent（skill+tool）输出，调用方不变。
>
> 本文件聚焦"怎么用 Agent / skill / tool 把内容运营推导逻辑真正落地"，含设计依据与后续替换点。

---

## 0. 用户的四个问题（本文逐一回答）

1. **从诊断报告过来的主题，内容规划是什么，怎么内容规划怎么来的，内容是什么，任务简报应该自动填写哪些？**
2. **如何根据上一步内容，推出需要哪些资料和素材？**
3. **资料与素材在这个位置合不合理？如果没有这些素材是不是连任务简报都没有了？**
4. **这个内容运营板块怎么对接 Agent / skill / tool？**

---

## 1. 现状诊断：内容运营板块的"Agent 断档"

### 1.1 内容运营数据流现状（已实现的原型）

```
上游信号（归因诊断 / 内容洞察 / 手动）
   │  现有：归因措施确认 → confirmMeasure 里硬编码创建 ct-attr-* 任务
   ▼
内容任务（ContentTask：origin + materialBudget 已在类型里）
   │
   ▼
七步工作台（①简报 ②渠道/发布目标 ③物料预算 ④生成 ⑤合规 ⑥渠道版 ⑦审批）
   │  现有：模板推导 budget、来源追踪区块
   ▼
效果复盘（ContentPerformance）
```

### 1.2 三个"断档"（当前原型没有的）

| # | 断档 | 表现 |
|---|---|---|
| **D1** | **没有「内容规划 Agent」** | `ct-008` 是 mock 硬编码的，`confirmMeasure` 里也是手写死标题/受众/渠道；真实应该是"归因结论 + 意图数据 → Agent 推导出内容任务简报" |
| **D2** | **物料预算是静态模板** | `MATERIAL_BUDGET_TEMPLATES` 按内容类型给固定清单，没有"拿着简报去知识库索引里查每项有没有来源"这一步 |
| **D3** | **内容运营没进 Agent 任务中心** | `AgentTaskRow.module` 只有 `attribution`/`health_fix` 被渲染，`module: 'content'` 在 `HistoryTasksViews` 里没有对应展示；`TARGET_MODULE_LABELS` 有 `ai_content_engine` 但没有真正的 Agent |

---

## 2. 回答 Q1：内容规划是什么、怎么来、简报自动填哪些

### 2.1 内容规划 Agent（`content-planner`）的输入/输出

**这是一个 `operation` 层的 Agent**（对齐 `AgentInfo.layer: 'operation'`），吃的是上游信号，吐的是"已结构化的内容任务简报"。

```
输入（上游信号，三选一）：
  A. 归因诊断措施（AttributionMeasure + 归属的 AttributionChange）
     - 措施：description / evidenceCard / rootCause / targetModule / reviewPeriod
     - 变化：changedMetric / funnelSegment / intentData（站内搜索词+来路关键词+客服意图）
     - 变化：evidence[]（多证据）
  B. 内容洞察机会（ContentOpportunity）
     - evidence / suggestedTitle / suggestedTheme / suggestedChannels / inferredAudience
  C. 手动创建请求（主题 + 受众草稿）

输出（ContentTask 简报字段，结构化）：
  title / type / kind / priority / theme / audience / userQuestion
  channels / locales / dueDate / reason
  origin（来源追踪：source + sourceLabel + attributionRef/opportunityId + evidence）
```

### 2.2 内容规划 Agent 的推导逻辑（不是黑盒，分三步）

```
第 1 步「定意图」：从上游证据确定访客到底在问什么
   - A 类（归因）：intentData 里有三层意图信号
       siteSearch 站内搜索词（如「CNC 加工配件」占比 22%）
       inboundKeyword 来路关键词（配件类词点击上升）
       csIntent 客服意图（配件咨询占比 18%）
     → userQuestion = 合并意图信号后的"访客问题"
     → audience = 意图信号指向的人群（搜索"配件"的人 = 采购决策者/维修工程师）
   - B 类（洞察）：从 evidence 推导（如"客服工单 18%"→ audience = 正在评估装配自动化的工程师）
   - C 类（手动）：从主题+受众推导 userQuestion

第 2 步「定形态」：从意图 + 业务目标定内容类型/渠道/优先级
   - 意图缺口（搜索无承接）→ 新建（create）内容承接，type 由缺口性质定
     （配件类目 → product/scenario；FAQ 型 → faq）
   - 现有内容表现下滑 → 优化（optimize）/重构
   - 社媒互动高 → 扩展（expand）子主题系列
   - 渠道：A 类由 funnelSegment 归属渠道；B 类用 suggestedChannels
   - 优先级：由 severity / evidence 强度推导

第 3 步「定证据」：把上游证据结构化进 origin，供简报「生成依据」区块展示
   → origin.evidence = { currentValue, benchmark, action }（来自 evidenceCard）
   → origin.attributionRef = { changeId, measureId, reviewPeriod }（A 类，回链归因）
   → origin.opportunityId = op.id（B 类）
```

### 2.3 任务简报自动填写的字段表（最终答案）

| 简报字段 | A 归因诊断 | B 内容洞察 | C 手动 |
|---|---|---|---|
| 标题 | 措施 deliverable.title（如「CNC 加工配件 · 智能营销页」） | suggestedTitle | 用户填 |
| 内容类型 | 意图缺口性质推导（product/scenario/faq） | type | 用户选 |
| 任务类型 | 缺口→create / 下滑→optimize | kind | 用户选 |
| 主题 | 意图信号合并（配件→CNC 加工配件） | suggestedTheme | 用户填 |
| 目标受众 | intentData 三层推导 | inferredAudience | 用户填 |
| 访客问题 | intentData.siteSearch 合并 | 主题+受众推导 | 主题+受众推导 |
| 渠道 | funnelSegment→渠道 | suggestedChannels | 用户选 |
| 语言站点 | 诊断涉及的站点/地域 | suggestedChannels 推断 | 用户选 |
| 优先级 | severity | suggestedPriority | 用户选 |
| 依据 | evidenceCard（现状/基准/动作） | evidence | 用户填 |
| 来源追踪 | origin.attributionRef | origin.opportunityId | origin.source=manual |

---

## 3. 回答 Q2：如何推出需要哪些资料和素材

### 3.1 物料预算推导 Agent（`content-material-budget`）

不是静态模板硬编码，而是**模板 × 知识库索引 → 缺口**的确定性流程：

```
第 1 步「拆模板」：按内容类型取素材需求模板
   case → [客户授权, 实施前后数据, 客户证言, 现场图片授权]
   guide → [关键参数/规格表, 行业基准, 术语定义, 检查清单]
   product → [规格/型号矩阵, 应用场景, 使用限制, 型号差异]
   faq → [客服工单高频问题, 条款/维护周期]
   insight → [白皮书/行业报告, 引用数据授权]

第 2 步「查知识库」：对每一项，用 searchKnowledge(query) 查企业知识库有没有可信来源
   - 命中已验证来源 → status: 'ready' + source
   - 未命中 → status: 'missing'
   - 命中但未授权 → status: 'pending_auth'
   query 从简报字段构造：主题 + 素材类型（如「CNC 加工配件 + 产品规格」）

第 3 步「出预算」：产出 MaterialBudgetItem[]，一次性列齐
   → 这就是用户要的"一次性给齐，别 loop"
```

### 3.2 为什么"根据上一步内容"？

素材需求推导的**输入是简报（步骤①产出）+ 渠道/语言站点（步骤②产出）**：
- 简报 → 内容类型（决定模板）、主题（构造检索 query）
- 渠道/语言站点 → 需要哪些语言的术语译名（localization 类素材）

这正是**渠道前置**的原因：没有"发到哪些语言站点"，就不知道需要哪些译名素材。

### 3.3 生成循环的缺口回流（已有）

生成时 RAG no-hit → `regenerateDraft` 自动追加为 `addedDuringGeneration` 预算项 → 用户一次性补齐 → 增量重生成。这是对"补一个冒一个"的根治。

---

## 4. 回答 Q3：资料与素材位置合不合理？没有素材会不会连简报都没了？

### 4.1 位置结论：渠道前置后，资料与素材放在第③步是合理的

- 依赖链：**渠道/语言站点（②）→ 素材需求（③）→ 生成（④）**
- 第③步作为**独立确认点**（用户看到"全部就绪"才放行）有仪式价值，但必须是一次性预算而非循环补。

### 4.2 "没有素材 → 简报没了？" —— 不，反过来

**任务简报永远是第一性的**（它来自上游诊断/洞察/手动，天然存在），**素材是"内容能否被证实"的检查点**，不是简报的前提：

```
简报（第①步）永远存在 ──来自上游，缺素材不阻塞
   │
   ▼
素材预算（第③步）从简报推导 ──缺素材只阻塞"进入生成"，不阻塞"简报本身"
   │
   ▼
生成（第④步）依赖素材就绪 ──缺素材时对应章节留空/标注待补充
```

**关键语义**：缺素材时任务停在"待补资料"（`needs_material`）状态，但**简报仍然可见、可编辑、可回链来源**。素材缺口是生成的前置，不是任务存在的前提。

### 4.3 例外：手动创建的"纯空"任务

只有手动创建时允许"简报字段不全就创建"，因为用户可能只有个想法。此时素材预算推导不出来（没主题），需要用户先补简报。但这不影响"简报第一性"原则——手动任务也是先有简报雏形，素材推导在其后。

---

## 5. 回答 Q4：内容运营板块怎么对接 Agent / skill / tool

### 5.1 三层对接架构

```
┌─ Agent 生态（智能体任务中心）────────────────────────┐
│  归因分析 Agent（attribution）                      │
│  健康度修复 Agent（health_fix）                     │
│  内容运营 Agent（content，NEW）← 本文重点            │
└──────────────┬──────────────────────────────────────┘
               │ AgentTaskRow.module = 'content'
               ▼
┌─ 内容运营 Agent 内部（skill 组合）───────────────────┐
│  skill: content-planner          ← 简报推导（Q1）   │
│  skill: content-material-budget  ← 素材推导（Q2）   │
│  skill: content-generate-draft   ← 母稿生成          │
│  skill: content-channel-adapt    ← 渠道版本生成      │
│  skill: content-incremental-regenerate ← 缺口回流    │
└──────────────┬──────────────────────────────────────┘
               │ 调用 tool
               ▼
┌─ Tool 层（可检索/可执行）───────────────────────────┐
│  searchKnowledge(query)  企业知识库 RAG 检索          │
│  searchGlossary(term)    术语库查询                   │
│  resolveIntent(intentData) 意图推导（Q1 第 1 步）      │
│  (后续) generateContent, publishContent             │
└──────────────────────────────────────────────────────┘
```

### 5.2 各 skill 的输入/输出 + 用到的 tool

| Skill | 输入 | 输出 | Tool |
|---|---|---|---|
| `content-planner` | 上游信号（归因措施/洞察/手动） | `ContentTask` 简报字段 + `origin` | `resolveIntent(intentData)` |
| `content-material-budget` | 简报 + 渠道/语言站点 | `MaterialBudgetItem[]` | `searchKnowledge(query)` |
| `content-generate-draft` | 简报 + 大纲 + 预算(已就绪) | `masterDraft` | `searchKnowledge`, `searchGlossary` |
| `content-channel-adapt` | masterDraft + 渠道字段 | `ChannelVersion[]` | `searchGlossary`（术语译名） |
| `content-incremental-regenerate` | 缺口项 | 受影响章节的重写 | `searchKnowledge` |

### 5.3 内容运营 Agent 与归因的联动闭环（关键）

```
归因报告确认 ai_content_engine 措施
   │  WorkbenchContext.confirmMeasure
   ▼
内容运营 Agent 任务创建（AgentTaskRow.module='content'，priority 从措施 severity）
   │  ★ 这里不再硬编码创建 ContentTask，而是：
   ▼
内容规划 Agent 运行（skill: content-planner）
   │  输入 = 归因变化 + 措施 + intentData
   ▼
产出 ContentTask（带 origin.attributionRef）→ 进入内容工作台
   │
   ▼
生产完成 → 发布 → 效果复盘（ContentPerformance）
   │
   ▼
复盘结果回写归因措施的 execStatus/reviewScript ← ★ 反向回链（现有 confirmMeasure 已做，但只 mock）
```

**关键改动**：`confirmMeasure` 里现在"手写死一个 task"应改为"**生成一条内容 Agent 任务** → Agent 运行 `content-planner` → 产出简报"。这需要：
1. `WorkbenchContext` 增加 `createContentAgentTask(measure, change)` 接口（现在只有直接 `setContentTasks`）。
2. `HistoryTasksViews` 渲染 `module: 'content'`（显示"内容运营"badge + 可跳内容工作台）。
3. mock 里补 `module: 'content'` 的 `AgentTaskRow`。

### 5.4 原型 vs 真实实现的分层

| 层 | 原型（现状） | 真实实现（后续） |
|---|---|---|
| UI/交互 | 已做（工作台、预算清单、来源追踪） | 复用 |
| 数据流 | mock + 手写推导 | Agent 产出（JSON schema） |
| 推导逻辑 | 硬编码模板/字段 | skill + tool（searchKnowledge） |
| 知识库 | 静态 mock（`knowledgeRiskEventsData`） | 真实 RAG API / 向量库 |
| 意图推导 | 手写映射 | `resolveIntent` tool（LLM 或规则） |

---

## 6. 开放问题（待用户拍板）

1. **内容运营 Agent 是否立即接入任务中心（TasksView）？** 还是先保持"归因确认 → 直接建内容任务"的现状，Agent 任务中心展示后续做？
2. **`content-planner` 用规则引擎还是 LLM？** 原型阶段：规则推导（模板化，如上文三步）即可；生产阶段可换 LLM 输出 JSON。建议**先规则后 LLM**。
3. **知识库检索 `searchKnowledge` 原型怎么模拟？** 建议 mock 一个 `searchKnowledge(query)` 返回"是否命中 + 来源 + 授权状态"，对应 `knowledgeRiskEventsData` 里的已知命中和缺口。后续接真实 API。
4. **诊断→内容联动改不改 `confirmMeasure` 逻辑？** 改成"创建内容 Agent 任务"（改大、更真实）还是保留"直接建任务"（改小）？

---

## 7. 落地顺序建议（v0.2 已实现前 1-3，剩余 4-5）

1. **✅ `searchKnowledge` mock 接口**（`src/lib/knowledge.ts`）：模拟知识库检索，返回命中/来源/授权，支撑物料预算与意图推导。
2. **✅ `content-planner` 规则化**（`src/lib/contentPlanner.ts`）：`planFromAttribution` 从归因变化+措施推导简报字段，含 intentData 三层意图推导。
3. **✅ `content-material-budget` 规则化**（`src/lib/materialBudget.ts`）：`deriveMaterialBudget` 模板 × `searchKnowledge` → 预算，真"查过库"，每项带来源/授权状态。
4. **⬜ 内容运营 Agent 接入任务中心**：mock 补 `module:'content'` 任务，`HistoryTasksViews` 渲染"内容运营"模块 + 跳转内容工作台。
5. **⬜ `confirmMeasure` 改成"建内容 Agent 任务"**（当前已改为直接调 `planContent` 建任务，若需要任务中心中间态再改）。
