import { PUBLISH_LABELS, ROW_ACTIONS, ROW_ACTION_LABELS, STATE_COMBOS, STATE_LABELS, rowActions } from './promotion'

// Publishing and promotion state rules (产品设计 5.1.1, 7.1.2, 7.2.5), shown from the page list and the publish step.
// The action matrix is generated from rowActions, the same function that drives the list's 操作 column.
const PUBLISH_RULES = [
  ['未发布', '新建页面，从未发布', '未生效', '不能设置推广', '去发布 → 已发布'],
  ['已发布', '线上为最新发布版本', '有效', '按推广状态展示', '修改内容 → 有未发布修改；下线 → 已下线'],
  ['有未发布修改', '草稿有修改，线上仍是上一个版本', '有效（上一版本）', '按推广状态展示', '更新发布 → 已发布（新版本）；下线 → 已下线'],
  ['已下线', '访客无法访问；版本、推广位置与推广设置保留', '失效', '不展示', '重新上线 → 已发布（沿用最近版本）；更新发布 → 已发布（新版本）'],
]
const PROMO_RULES = [
  ['未推广', '没有加入任何推广位置', '不展示', '加入推广位置 → 按日期进入待开始 / 推广中'],
  ['待开始', '今天早于开始日期', '不展示', '暂停 → 已暂停；结束 → 推广已结束'],
  ['推广中', '在推广期内；时段外显示“不在时段”', '时段内展示（电脑、平板、手机均展示）', '暂停 → 已暂停；结束 → 推广已结束'],
  ['已暂停', '手动暂停，优先于日期判断', '不展示', '恢复 → 按日期回到待开始 / 推广中 / 推广已结束；结束'],
  ['推广已结束', '超过结束日期，或手动结束', '不展示', '修改推广期 / 重新开始推广 → 按日期重新判定'],
  ['页面已下线', '页面下线，推广设置保留', '不展示', '重新上线后按日期恢复'],
]

export default function StatusRules() {
  const table = (head: string[], rows: string[][]) => <table className="rules-table"><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{rows.map(r => <tr key={r[0]}>{r.map((c, i) => i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>)}</tr>)}</tbody></table>
  return <div className="status-rules">
    <h4>发布状态 · 决定链接是否有效</h4>
    {table(['状态', '含义', '链接', '推广展示', '操作 → 结果'], PUBLISH_RULES)}
    <h4>推广状态 · 决定是否在推广位置展示</h4>
    {table(['状态', '判定', '访客展示', '操作 → 结果'], PROMO_RULES)}
    <h4>状态组合与可用操作 · 页面列表“操作”列</h4>
    <table className="rules-table rules-matrix"><thead><tr><th>发布状态</th><th>推广状态</th>{ROW_ACTIONS.map(a => <th key={a}>{ROW_ACTION_LABELS[a]}</th>)}</tr></thead>
      <tbody>{STATE_COMBOS.map(({ pub, promo }) => { const acts = rowActions(pub, promo || 'none')
        return <tr key={`${pub}-${promo}`}><th scope="row">{PUBLISH_LABELS[pub]}</th><th scope="row">{promo ? STATE_LABELS[promo] : '—（发布后可推广）'}</th>
          {ROW_ACTIONS.map(a => <td key={a} className={acts.includes(a) ? '' : 'no'}>{acts.includes(a) ? '✓' : '—'}</td>)}</tr> })}</tbody></table>
    <ul className="rules-notes">
      <li>分工：右上角“推广位置”按网站页面查看并调整关联的营销页与顺序；每行“推广设置”修改该营销页的推广文案、位置与时间；列表批量操作只有暂停、恢复、结束推广。</li>
      <li>批量暂停、恢复、结束只作用于已选页面中状态允许该操作的页面，按钮显示可生效的数量。</li>
      <li>判定顺序：未加入位置 → 页面下线 → 已暂停 → 手动结束 → 推广期 → 每日时段 → 不再提醒。</li>
      <li>暂停、结束只影响推广展示，不影响链接；下线只影响链接与展示，不清除推广设置。</li>
      <li>更新发布、下线与重新上线都不改变暂停状态；推广文案、推广期与时段属于营销页、对其所有位置生效，在列表“推广设置”或发布页修改，是同一份配置。</li>
    </ul>
  </div>
}
