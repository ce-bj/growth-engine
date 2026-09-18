# 业务指标归因 Agent

读 `growth_metrics_service` 的 `get_snapshot`，不算数。

## 怎么跑

主 Agent 已接入 `delegate_metrics_agent`。在 Demo 聊天里说：

- 「帮我看下站点留资为什么跌了」
- 「对 site_demo_b2b 做一次增长诊断」

或直连：

```powershell
$env:PYTHONPATH = "<outputs>;<outputs>\agents-workspace"
python -c "from growth_attribution_agent import build_agent; print(build_agent().name)"
```

## 目录

- 工具：`get_snapshot` / `get_metric_detail` / `get_page_content` / `propose_hypothesis` / `record_handoff_mock`
- 计算在 `../growth_metrics_service/`（59 指标 + 13 假设，改 JSON 不改 Agent）
- 任务说明：只交接现网运营助手 Skill，`tasks[].handoff_prompt` 是可复制提示词
- `skills/growth-diagnosis/SKILL.md`：读快照、两档输出、工单三档（系统提示只留人设和禁令）

## 两档输出

默认出**摘要版**：一句话结论 + 发生了什么 + 现在能做什么，400 字内，不出现流失点/三态/pp 这类内部说法。
用户说「看详细依据 / 完整报告 / 排除了哪些」才展开**完整六节**。

摘要版素材来自 `snapshot.headline`，指标措辞来自 `metric_dict.json` 的 `plain`。
**想改 Agent 怎么说话，改 `plain` 就行，不用动提示词。**

## 注意

数字来自 mock 数据包，不是真数仓。换真数据时只替换 `growth_metrics_service` 的取数层。
