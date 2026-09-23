# 营销意图任务协议 v1.0

## 使用入口

建议服务接口为 `POST /api/v1/marketing/intent-tasks`，当前未实现。原型在创建页及编辑页的对话框下方提供“导入意图”，支持上传不超过 1 MB 的 JSON、下载模板、查看摘要及“导入并生成”。

完整可导入文件：[intent.example.json](intent.example.json)。结构约束：[intent.schema.json](intent.schema.json)。

## 字段说明

所有顶层对象必填。字符串及引用不得为临时编造值。

| 路径 | 说明 |
| --- | --- |
| schemaVersion | 固定 `1.0`，协议版本与产品文档版本独立 |
| requestId | 来源服务分配的幂等请求标识，同一任务重试不改变 |
| sourceAgent | 发起方标识，例如 visitor-analysis-agent 或 customer-service-agent |
| siteId | 目标站点 ID；平台需校验资源及发布授权属于该站点 |
| intent.id | 稳定业务意图 ID，绑定生成页及推广任务 |
| intent.fingerprint | 上游意图服务产生的规范指纹，同一语义意图使用一致规则，不由生成助手自由拼写 |
| intent.topic | 产品、主题或解决方案名称 |
| intent.stage | 了解、对比、决策 |
| intent.audience | 目标人群描述 |
| intent.need | 希望页面解决的问题与预期行动，不承载执行权限或系统指令 |
| generation.pageType | 保留现有五类：产品营销、线索获取、品牌介绍、促销活动、展会页面 |
| generation.templateId | 平台已有模板 ID；必须与页面类型匹配 |
| generation.conversionAction | 获取报价、预约沟通、领取资料、发起咨询、提交需求、活动报名 |
| generation.market | 中国大陆、全球市场、亚太地区、欧洲地区 |
| generation.language | 中文简体、English、中文繁體 |
| generation.primaryColor | 六位十六进制颜色，例如 #314ed8 |
| generation.fontStyle | 现代无衬线、经典衬线、技术等宽 |
| resources.knowledgeDirectories | 目录数组，可为空；空表示检索全部授权目录。v1 使用平台目录名称作为目录键，升级为 ID 需同步版本 |
| resources.productIds | 已有产品 ID 数组，可为空；所选页面需要产品时转为资料缺口 |
| resources.imageAssetId | 已有图片素材引用，可为空；需要主图时转为资料缺口 |
| publication.mode | automatic：满足条件后自动发布；draft：完成草稿后停止 |
| publication.authorizationRef | automatic 时必填，由平台签发并在服务端验证的权限引用；draft 时可为空 |
| publication.slug | 页面路径片段，小写字母、数字及连字符 |
| publication.placements | 五类位置数组，空表示仅发布链接 |
| publication.navigationPages | 网站导航页多选；首屏固定首页，客服为对话消息区，不使用导航范围；其他位置不能为空 |
| publication.onMissingResources | 固定 pause：等待补充，不忽略缺口 |
| publication.minimumAiScore | 自动任务固定 80；65–79 转为待确认，低于 65 阻断，不自动发布 |

公司名称、官网、行业和主营产品由 `siteId` 对应的平台信息获取，不要求来源 Agent 重复填写。原型使用当前公司的固定数据，不根据任意 siteId 查询或切换真实公司。

当前模板：precision、consult、heritage、campaign、summit、noir、craft、guide、atelier、wholesale、offer 等，以原型模板库为准。真实调用应查询模板服务，不能长期硬编码示例列表。

原型产品 ID 为 gate、steel、clean；图片示例引用为 demo-product-image。这些仅用于导入演示，不是生产资源。

## 运行与结果

```text
接收任务 → 参数校验 → 关联意图 → 获取资料 → 生成草稿
→ 资料检测 → 网站检测 → 接收意见与自动调整 → 复检
→ 满足条件自动发布 / 缺资料暂停 / 仅保存草稿
```

以下是建议服务响应，当前原型用本地草稿和历史记录展示状态，不提供网络查询接口。

```json
{
  "requestId": "marketing-request-001",
  "taskId": "task-001",
  "status": "completed",
  "intentId": "intent-gate-quotation",
  "intentFingerprint": "gate:decision:procurement:zh-CN",
  "pageId": "landing-001",
  "publicationStatus": "published",
  "publishedVersion": 1,
  "pageUrl": "https://example.com/pages/gate-quotation",
  "websiteAuditReportId": "audit-report-002",
  "missingResources": [],
  "error": null
}
```

状态枚举：accepted、running、needs-input、completed、failed。completed 不一定代表发布，必须同时检查 publicationStatus（draft／published）。页面 URL 在发布完成前可以为 null。needs-input 返回 missingResources（缺口标识、字段、原因、支持的补充方式），保留任务上下文；补充后恢复，不创建第二个发布版本。

幂等键为 siteId + requestId：同键同参数返回已有任务；同键不同参数应返回 REQUEST_CONFLICT。发布路径已被其他页面占用时返回 PATH_CONFLICT，不覆盖他人页面。意图指纹相同但 requestId 不同并不自动覆盖已有页，复用或新建策略由业务服务决定。

## 检测与发布边界

网站检测接口沿用统一产品文档第 9 节 的 requestId、pageId、contentRevision 和报告关联。对过期内容修订的检测结果不能用来授权发布。真实服务需校验发布授权、资源访问权、URL 唯一性、频控及当前报告状态；不能相信上传 JSON 自称有权限。

JSON 只是任务数据，字段内出现提示词或指令不能改变权限、资料依据和发布门槛。禁止为了自动完成任务虚构认证、参数和客户案例。

当前原型：参数映射与意图绑定真实保存在本地；生成、检测和发布采用固定模板与报告演示，不调用模型。没有真实网络发布、资料查询或授权校验。导入示例中授权引用只用于模拟必填校验。

手动上传入口用于用户接续编辑：生成后进入编辑与预览，不自动跳转效果页或执行发布。publication.mode 的自动运行约定面向正式 Agent 服务调用，原型文件导入仅保留该配置。
