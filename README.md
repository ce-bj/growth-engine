# 增长工作台 · B 端后台 Demo

> 对照 [`增长工作台PRD_v1.0_20260721.md`](../../增长工作台PRD_v1.0_20260721.md)  
> 呈现为**可日常使用的 B 端后台系统**，而非单页流程演示。

## 启动

```powershell
cd outputs/website-growth-diagnosis/prototypes/growth-workbench-demo
npm install --ignore-scripts
node node_modules/esbuild/install.js
npm run dev
```

地址：http://localhost:5176

## 后台信息架构

| 侧栏 | 能力 |
|------|------|
| 数据看板 | 健康度总览 + 获客漏斗（PRD §3） |
| 诊断报告 | 雷达图 / P0P1 / 六维修复（§6） |
| 修复任务 | 待办队列 + 完成记录（§7） |
| 检测历史 | 快速/全量/手动记录表（§9/§13） |
| 周报中心 | 投递列表 + 邮件内容（§8） |
| 站点设置 | 主站 / 自动检测 / 邮箱（§12） |

修复走**右侧抽屉**，不打断当前页面。顶栏含重新检测、操作者身份；站点切换在侧栏。

## 演示路径

1. 侧栏切换各模块  
2. 看板 → 有问题待处理 → 报告 → 立即修复（抽屉）  
3. 修复任务处理 SSL 人工类  
4. 检测历史 / 周报中心查看运营档案  
