import { PLACEMENT_TYPES, flatSitePages, slotKey } from './promotion'

// Promotion slots of one marketing page: placement type, then website pages ticked one by one (no select-all).
// Planned types are listed but cannot be chosen yet (产品设计 7.2.1).
export default function SlotPicker({ value, onChange, counts }: { value: string[]; onChange: (slots: string[]) => void; counts?: Record<string, number> }) {
  const pages = flatSitePages()
  return <div className="slot-picker">
    {PLACEMENT_TYPES.map(type => {
      return <section key={type.name} className={type.ready ? '' : 'is-planned'}>
        <header><strong>{type.name}</strong>
          <small>{type.ready ? type.help : `规划中 · ${type.help}`}</small></header>
        {type.ready && <ul>{pages.map(p => { const slot = slotKey(type.name, p.key)
          return <li key={p.key} style={{ paddingLeft: p.depth * 18 }}><label className="checkline"><input type="checkbox" checked={value.includes(slot)} onChange={e => onChange(e.target.checked ? [...value, slot] : value.filter(s => s !== slot))} />{p.name}<code>{p.key}</code>{counts?.[slot] ? <span className="slot-count">{counts[slot]} 个营销页</span> : null}</label></li> })}</ul>}
      </section>
    })}
  </div>
}
