# 内容生产工作流重构 · 设计方案

> 状态：**已实现 v0.1**（2026-08-03）· 讨论稿已转实现，本文件保留设计依据
> 范围：内容运营工作台（`growth-engine/src/views/content/` 及 `ContentView.tsx`）
> 目标：把「任务简报→资料与素材→渠道→生成→审核→发布」从**孤立的表单步骤**重构为**有源头、有依据、可回链、一次性闭环**的生产流

> **实现说明**：§1 三个决策、§2 目标流程、§3.1–3.3、§3.6 已落地原型；§3.4–3.5 逻辑保留（仅步骤号变化）；§4–§5 大部分落地；§6 Agent/skill/tool 落地为后续阶段。

---

## 0. 现状诊断（为什么改）

### 0.1 任务来源"半吊子"，没有一条真正闭环

| 来源 | 现状 | 缺陷 |
|---|---|---|
| **归因报告（诊断）** | `targetModule: 'ai_content_engine'` 的措施，确认后仅把 `execStatus` 置为 `success`，交付物是一个 mock 预览 URL | **完全不创建内容任务**。诊断结论（证据卡/根因/复盘周期）丢失，无处落地 |
| **内容洞察 → 计划项** | `ContentOpportunity` → `ContentPlanItem` → 转入生产（`promoteToTask`） | 转入时 `audience` 被硬编码为 `'待细化目标受众'`，`userQuestion: ''` 空着，来源证据只留在 `reason` 里 |
| **手动新建** | `ContentCreateDrawer`，7 个字段全手填 | `userQuestion`/`outline`/`knowledge`/`missingMaterials` 全空，靠生成阶段"AI 自动分析补全" |

**结论**：任务简报当前是 6 个**孤立输入框**（标题/受众/访客问题/主题/依据/时间），没有任何"从哪来"的痕迹，也没有诊断证据、关联知识点、待补资料的预告。

### 0.2 步骤 1「资料与素材」位置可疑且逻辑不自洽

- **顺序错误**：资料与素材排在渠道（步骤 2）之前，但它依赖渠道——「发布到哪些语言站点」决定了需要哪些术语译名、哪些素材。当前资料步骤不知道内容发到哪个网站/站点（用户原话）。
- **定位错误**：`task.knowledge` 是**生成后**才产出的回显（RAG no-hit 侧栏在生成页），放在资料步骤只是"预告"；`missingMaterials` 是**预先枚举**的清单。两者放在同一步骤，语义混乱。
- **无闭环**：现状是"补完一次性按钮 → 进入生成 → 生成时 RAG 又 no-hit → 再冒出新缺口 → 用户回头补 → 再重新生成"。用户明确反感这种**反复打断**的循环（用户原话：'每次 loop 让用户补充资料，很烦'）。

### 0.3 步骤间耦合的强依赖事实

`task.locales`（语言站点）已在 `ContentTask` 类型里，但只在生成后才被用到；渠道配置（步骤 2）只选 `website/linkedin/facebook/x` 四个渠道，不选语言站点。术语译名缺口（`missingTerms`）、素材需求（`missingMaterials`）、知识缺口（`missingTerms` + RAG no-hit）全都**间接依赖"发布到哪些站点"**。

---

## 1. 三个已确认的方向性决策

| 决策 | 结论 |
|---|---|
| **A. 步骤顺序** | **渠道提前，三步对调**：①任务简报 → ②渠道与发布目标 → ③资料与素材 → ④内容概览生成 → ⑤质量与合规 → ⑥渠道内容生成 → ⑦审批与发布 |
| **B. 资料与素材定位** | **一次性物料预算**：进入生成前，系统把"这篇内容共需哪些素材、哪些已就绪、哪些缺失"**全部一次算齐**给用户；不再补一个冒一个 |
| **C. 任务简报生成** | **上游带过来 + 只做确认**：诊断/洞察转来的任务，字段由来源证据 + 内容规划 Agent 预填，用户确认，且带「生成依据/来源追踪」区块 |

---

## 2. 目标流程（改后）

```
上游信号（归因诊断 / 内容洞察 / 手动）
        │
        ▼
┌─ 内容规划（Agent）───────────────┐
│ 从来源证据 + 站点诊断推导：        │
│  主题 / 受众 / 用户问题 / 渠道 /   │
│  内容类型 / 任务类型 / 优先级       │
│ 产出「计划项」（ContentPlanItem）  │
└──────────────┬──────────────────┘
               │ 转入生产（promoteToTask）
               ▼
┌─ 内容任务（ContentTask）──────────┐
│ 步骤① 任务简报（来源追踪+确认）     │
│ 步骤② 渠道与发布目标（含语言站点）   │
│ 步骤③ 资料与素材（一次性物料预算）   │
│ 步骤④ 内容概览生成（大纲+母稿）      │
│ 步骤⑤ 质量与合规（逐条闭环）         │
│ 步骤⑥ 渠道内容生成                   │
│ 步骤⑦ 审批与发布                     │
└──────────────┬──────────────────┘
               │ 生成循环（RAG 缺口自动回流预算）
               ▼
       效果复盘（ContentPerformance → 新洞察）
```

---

## 3. 分步方案

### 3.1 步骤① 任务简报：来源追踪 + 上游预填

**现状**：6 个孤立输入框。
**目标**：简报 = 来源证据 + 规划 Agent 预填，用户只确认。

**新增「生成依据 / 来源追踪」区块**，置于简报顶部：

```
┌─ 生成依据 ─────────────────────────────┐
│ [图标] 来自：归因分析 · 广告渠道落地页跳出率   │
│  根因：广告渠道落地页与广告创意不匹配           │
│  证据：落地页跳出率 52% vs 行业基准 42%        │
│  复盘：T+7  ·  [回到归因报告]                  │
└──────────────────────────────────────────┘
```

**按来源的预填字段表**：

| 字段 | 来源 A：归因诊断 | 来源 B：内容洞察 | 来源 C：手动 |
|---|---|---|---|
| 标题 | 措施标题（如「广告渠道落地页 · 重写版」） | `suggestedTitle` | 用户填 |
| 任务类型 | 建议 action（重写/新建） | `kind` | 用户选 |
| 主题 | 诊断主题 | `suggestedTheme` | 用户填 |
| 目标受众 | 诊断 `intentData`（站内搜索词/来路关键词/客服意图）推导 | 从 evidence 推导（**不再硬编码"待细化"**） | 用户填 |
| 访客问题 | 从主题+受众推导 | 从主题+受众推导 | 从主题+受众推导（不再留空） |
| 目标渠道 | 诊断归属渠道（funnelSegment→渠道） | `suggestedChannels` | 用户选 |
| 任务依据 | 证据卡（现状/基准/动作） | `evidence` | 用户填 |
| **回链** | 归因变化 ID + 复盘周期 | 洞察 ID | — |

**数据模型**：`ContentTask` 新增 `origin` 字段（见 §5）。

### 3.2 步骤② 渠道与发布目标：语言站点纳入

**现状**：只选 4 个渠道，配置 `channelProfiles` 字段。
**目标**：渠道选择 + **语言站点选择** + 发布网站/栏目目标确认，一并产出，供步骤③物料预算消费。

- 渠道选择（4 渠道）→ 现有字段配置（`CHANNEL_FIELD_DEFS`，并入本步）。
- **语言站点选择**：`task.locales` 正式纳入本步，选英语站/德语站等。术语译名缺口（`missingTerms`）在**本步**即可预警。
- **发布目标确认**：如网站栏目路径 / 账号归属，作为字段配置的一部分（现有 `CHANNEL_FIELD_DEFS` 已含 `columnPath`/`account` 等，纳入确认）。

### 3.3 步骤③ 资料与素材：一次性物料预算（核心改造）

**用户诉求（原话）**：'你可以预先出个方案，大概需要哪些东西给到用户，你调用哪些东西也给用户看，不然每次 loop 让用户补充资料，很烦，一起性缺少的给齐'。

**核心思想**：把"素材需求"从**被动枚举**（补一个冒一个）升级为**一次性物料预算（Material Budget）**。

**物料预算 = 内容类型模板 × 知识库索引 → 缺口清单（一次性算齐）**

推导逻辑（可追溯，非黑盒）：
1. **按内容类型模板拆解**：每种 `ContentType` 有固定的"素材需求模板"。
   - `case`（客户案例）→ 客户授权、实施前后数据、客户证言、现场图片授权
   - `guide`（指南）→ 关键参数/规格表、行业基准、术语定义
   - `product` → 产品规格、应用场景、限制条件、型号差异
   - `faq` → 客服工单数据、维护条款、常见问题来源
   - `insight` → 白皮书/行业报告、数据来源授权
2. **逐条映射到知识库索引**：模板里每一项，去企业知识库查"有没有可信来源"。有 → 标记「已就绪」；没有 → 进入 `missingMaterials`。
3. **产出「资料就绪清单」**：每一项显示 `[已有来源] / [缺失，需要补] / [待授权]`，用户只补缺失的。

**UI 形态**：不是简单列表，而是**清单 + 状态 + 来源**：

```
┌─ 物料预算 ────────────────────────────────┐
│ 内容类型：客户案例  目标站点：中文/英语/德语   │
│ ┌──────────────────────────────────────┐ │
│ │ ✅ 客户授权资料        已就绪 · 来源：CRM │ │
│ │ ⚠️ 实施前后节拍数据    缺失    · 需客户授权│ │
│ │ ❌ 现场图片授权        待授权  · 需法务确认│ │
│ │ ✅ 客户证言            已就绪 · 来源：项目中心│ │
│ └──────────────────────────────────────┘ │
│ 进度：2/4 已就绪 · [全部就绪后进入生成]      │
└──────────────────────────────────────────┘
```

**关键约束（对应"一次性给齐"）**：
- 预算在**进入生成前**算齐，用户一次性确认。
- 生成循环中若仍有 RAG no-hit → **自动归入预算的缺口项**，标记为"生成中新增缺口"，而不是另起一轮打断。
- 用户**一次性补齐**（或标记"已知缺口，可接受"）→ **增量重生成**，只重做受影响章节，不整篇重来。

### 3.4 步骤④ 内容概览生成：依赖物料预算

- 未就绪素材 → 生成时对应章节标注"待补充"或跳过。
- `hasDraftGap`（知识缺口）逻辑保留，但来源改为**预算缺口** + RAG no-hit，而非独立的 `missingTerms` 计数。
- 重新生成入口文案改为"已补齐预算缺口，增量重生成"。

### 3.5 步骤⑤ 质量与合规 / ⑥ 渠道内容生成 / ⑦ 审批与发布

- **不变**（上一轮已把合规改为逐条闭环）。仅步骤索引号变化（原 4/5/6 → 现 5/6/7）。
- 步骤⑥渠道版本生成、⑦审批发布逻辑不动。

### 3.6 生成循环闭环（RAG 缺口回流预算）

```
生成（步骤④）
   │ 调 Agent + 企业知识库
   ▼
RAG no-hit 事件
   │
   ▼
归入「物料预算」缺口项（标记：生成中新增）
   │
   ▼
用户一次性补齐 / 标记已知缺口
   │
   ▼
增量重生成（只重做受影响章节）
```

---

## 4. 涉及文件与改动点

| 文件 | 改动 |
|---|---|
| `types.ts` | `ContentTask` 新增 `origin`；`ContentOpportunity` 可选增 `inferredAudience`；`ContentPlanItem` 可选增 `inferredAudience`（或复用 `reason` 推导） |
| `data/contentMock.ts` | `contentTasksData` 各任务补 `origin`；`contentOpportunitiesData` 补 `inferredAudience`；新增按内容类型的物料预算模板 demo |
| `views/content/ContentPrimitives.tsx` | `CONTENT_STEPS` 重排；`getTaskStep` 状态→步骤映射更新；新增 `MATERIAL_BUDGET_TEMPLATES`（内容类型→素材需求模板） |
| `views/content/ContentWorkbench.tsx` | 步骤②新增语言站点/发布目标；步骤③重写为物料预算清单；步骤①新增来源追踪区块 |
| `views/content/ContentPlan.tsx` | 计划项卡片展示"来源追踪"；`promoteToTask` 带 origin 过去 |
| `views/content/ContentCreateDrawer.tsx` | 手动创建时也生成来源区块（"手动创建"）；`userQuestion` 由 AI 推导 |
| `views/ContentView.tsx` | `promoteToTask` 预填 `origin`/`audience`/`userQuestion`；`adoptOpportunity` 不再硬编码"待细化目标受众" |
| `views/AttributionReportView.tsx` + `context/WorkbenchContext.tsx` | `targetModule=ai_content_engine` 措施确认执行后 → 真正创建内容任务（含 origin 回链），而非仅 mock 预览 |
| `views/content/ContentOverview.tsx` | 待处理事项里的"诊断转来"任务可跳转到工作台对应步骤 |
| `styles.css` | 来源追踪区块、物料预算清单、步骤②语言站点选择的样式 |

---

## 5. 数据模型变更（草案）

```ts
// ContentTask 新增
origin?: {
  source: 'attribution' | 'opportunity' | 'manual'
  /** 归因：关联的变化 + 措施 + 复盘周期 */
  attributionRef?: { changeId: string; measureId: string; reviewPeriod: ReviewPeriod }
  /** 洞察：关联的机会 */
  opportunityId?: string
  /** 诊断证据卡（现状/基准/动作） */
  evidence?: { currentValue: string; benchmark: string; action: string }
}

// 物料预算（ContentTask 内，或独立）
materialBudget?: MaterialBudgetItem[]
interface MaterialBudgetItem {
  id: string
  /** 素材名，如"客户授权资料" */
  name: string
  /** 对应内容类型模板的哪一项 */
  templateKey: string
  status: 'ready' | 'missing' | 'pending_auth'
  /** 已有来源，如"CRM" */
  source?: string
  /** 生成中 RAG no-hit 追加标记 */
  addedDuringGeneration?: boolean
}
```

---

## 6. 后续用 Agent / skill / tool 实现（规划）

用户明确提出："后续肯定使用 agent scope 的 tool skill 等配合，实现这些内容。"

### 6.1 物料预算推导（步骤③）

- **Skill**：可定义一个 `content-material-budget` 技能，封装"内容类型→素材模板→知识库检索→缺口判断"的确定性流程。
- **Tool（知识库检索）**：物料预算的"逐项查知识库"需要一个**知识库检索工具**（现有 mock 里 `knowledgeRiskEventsData` 暗示存在企业知识库，但原型里是静态数据；实现时接真实的 RAG 检索 API 或 mock 一个 `searchKnowledge(query)`）。
- **Agent**：预算推导本身可交给一个 **内容规划 Agent**（内容运营 Agent 工作方法论 §2.3），输入简报+站点，输出物料预算清单（结构化为 `MaterialBudgetItem[]`，agent 产出为 JSON schema）。

### 6.2 任务简报预填（步骤①）

- **Agent**：来源 A/B/C 统一走**内容规划 Agent**，从来源证据推导 `audience`/`userQuestion`/`theme`（不再硬编码"待细化目标受众"）。
- **Tool**：`intentData`（归因诊断的站内搜索词/来路关键词/客服意图）是现成的推导输入，无需新工具。

### 6.3 生成循环闭环（RAG 缺口回流）

- **Tool（RAG 检索）**：生成时调 RAG → no-hit 事件回流到预算缺口。
- **Agent**：`regenerateDraft` 改为"增量重生成"（只重做受影响章节），需要按缺口定位章节的定位逻辑。
- **Skill**：可定义一个 `content-incremental-regenerate` 技能。

### 6.4 诊断→内容联动

- **Tool**：归因报告确认执行 → 创建内容任务，跨模块状态联动（`WorkbenchContext` 或新增 `ContentContext`）。

---

## 7. 开放问题（待用户拍板）

1. **步骤③物料预算的"知识库索引"**：原型阶段用 mock（静态模板+静态知识库），还是真的接一个 `searchKnowledge(query)` mock 接口？
2. **手动新建是否也走"内容规划 Agent 预填"**：还是只对来源 A/B 预填，手动保持纯手填？（现状 create drawer 说"AI 自动分析补全"，说明意向是后者）
3. **生成循环的"增量重生成"**：原型是否要实现"只重做受影响章节"，还是先做"整篇重生成 + 缺口标记"的简化版？
4. **诊断→内容联动**：归因措施确认后创建的内容任务，`ContentView` 里 tasks 状态在 `ContentView` 本地，归因在 `WorkbenchContext` 全局——**状态归属**需要定：内容 tasks 是否上移到全局？还是跨模块用一个"待执行队列"？

---

## 8. 与 Agent 生态的衔接（对齐现有设计）

- 现状 `AgentInfo` 已有 `layer: 'report' | 'fix' | 'operation'` 分层；内容运营 Agent 方法论在 mock 注释中已提及（`contentOpportunitiesData` 注释：'内容运营 Agent 工作方法论 §2.3 第①段"内容洞察"'）。
- 内容规划 Agent 可挂到 `operation` 层，与归因/健康修复 Agent 平级，共享"智能体任务中心"（`AgentTaskRow`）。
- 物料预算、增量重生成、术语译名补全可分别作为该 Agent 的 **skill**（`content-material-budget`、`content-incremental-regenerate`、`content-glossary-fill`）。

---

## 9. 落地顺序建议

1. **改步骤顺序**（最小、独立）：`CONTENT_STEPS` + `getTaskStep` + 步骤索引引用。
2. **步骤②纳入语言站点**：类型 + mock + 工作台 UI。
3. **任务简报来源追踪 + 预填**：`origin` 字段 + mock 数据 + 简报区块。
4. **物料预算**（核心）：`MATERIAL_BUDGET_TEMPLATES` + 工作台重写步骤③ + RAG 回流。
5. **诊断→内容联动**（跨模块，最后做）：归因确认创建任务。
