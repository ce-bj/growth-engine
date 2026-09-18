# 指标数据分析服务

确定性底座：**不算 LLM**。业务分析 Agent 只读这里的产物。

改假设 / 措施 / 阈值 → 改 `config/*.json`，不改引擎、不改 Agent。

## 怎么跑

```powershell
$env:PYTHONPATH = "<outputs>;<outputs>\agents-workspace"
python -m growth_metrics_service.tools.verify_step1
python -m growth_metrics_service.tools.verify_step2
```

Python 直调：

```python
from growth_metrics_service.api import get_snapshot, get_page_content, propose_hypothesis
snap = get_snapshot("site_demo_b2b")
```

## 目录

| 路径 | 谁改 |
|---|---|
| `config/metric_dict.json` | 产品经理（口径） |
| `config/hypothesis_lib.json` | 运营提 / PM 批 |
| `config/measure_lib.json` | 运营提 / PM 批（含复盘看哪些指标） |
| `config/thresholds.json` | 运营（档位） / 产品（死档政策） |
| `mock/site_demo_b2b/` | 研发（数据包） |
| `engine/` | 研发（求值器，禁止 `if 假设N`） |
| `pending/` | Agent 提议，运营确认后才入库 |

详见 `SPEC.md`。
