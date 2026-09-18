> 历史归档，不再维护。当前产品规则见[统一产品文档](../AI营销落地页-产品设计.md)。

# AI 营销落地页：跨 Agent 意图任务

版本：v0.6（未发布）

## 交付内容

其他 Agent 传递意图任务 JSON，即可关联意图、选择模板与资料、启动生成，并按任务中的发布方式继续运行。本次为前端导入及自动流程演示，不实现 Agent 服务或真实发布。

- [Skill 使用入口](../skills/marketing-intent-handoff/SKILL.md)
- [字段、运行及结果说明](../skills/marketing-intent-handoff/references/protocol.md)
- [JSON Schema](../skills/marketing-intent-handoff/references/intent.schema.json)
- [可直接导入的意图文件](../skills/marketing-intent-handoff/references/intent.example.json)

## 意图 JSON

```json
{
  "schemaVersion": "1.0",
  "requestId": "marketing-request-001",
  "sourceAgent": "visitor-analysis-agent",
  "siteId": "site-demo",
  "intent": {
    "id": "intent-gate-quotation",
    "fingerprint": "gate:decision:procurement:zh-CN",
    "topic": "铸铁闸门",
    "stage": "决策",
    "audience": "工程采购负责人",
    "need": "介绍铸铁闸门的应用场景与选型服务，引导采购负责人获取报价。"
  },
  "generation": {
    "pageType": "产品营销",
    "templateId": "precision",
    "conversionAction": "获取报价",
    "market": "中国大陆",
    "language": "中文简体",
    "primaryColor": "#314ed8",
    "fontStyle": "现代无衬线"
  },
  "resources": {
    "knowledgeDirectories": ["产品资料", "企业与品牌"],
    "productIds": ["gate"],
    "imageAssetId": "demo-product-image"
  },
  "publication": {
    "mode": "automatic",
    "authorizationRef": "demo-publish-grant",
    "slug": "gate-quotation",
    "placements": ["智能客服推送"],
    "navigationPages": ["产品中心"],
    "onMissingResources": "pause",
    "minimumAiScore": 80
  }
}
```

## 原型交互

页面历史与创建页顶部点击“导入意图” → 上传 JSON → 查看意图、来源、模板和执行方式 → 导入并运行。

首版自动关联 intent.id 与 fingerprint，保留原始 requestId/sourceAgent/siteId。前端按模板呈现生成结果，再展示网站检测协作。资料齐全且返回分数满足门槛时，automatic 任务创建本地发布版本并进入效果页；draft 任务停留在编辑页。资料不足显示待补充，使用现有补充流程完成后恢复。

重复导入同一请求返回已有页面，参数不同则提示使用新的 requestId。上传错误返回字段提示，不覆盖当前草稿。示例使用固定知识、产品、素材及检测报告，验证流程不代表实际知识检索或事实审核。

Skill 包保存在项目文档目录，可整体复制给其他 Agent 使用；未自动安装到系统技能目录。真实平台接入必须验证 authorizationRef，导入文件不会自行授予发布权限。
