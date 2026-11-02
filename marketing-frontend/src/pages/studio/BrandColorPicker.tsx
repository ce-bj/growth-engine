export const WEBSITE_COLOR = '#2165b7'

const COLORS = [
  { name: '深蓝', value: '#314ed8' },
  { name: '青绿', value: '#237569' },
  { name: '暖棕', value: '#816044' },
  { name: '朱红', value: '#a74731' },
  { name: '紫色', value: '#5848b8' },
]

export default function BrandColorPicker({value,onChange}:{value:string;onChange:(color:string)=>void}) {
  const selected = /^#[0-9a-f]{6}$/i.test(value) ? value : WEBSITE_COLOR
  return <div className="brand-color-picker" role="group" aria-label="选择主色调">
    <button type="button" className="brand-color-website" aria-pressed={selected.toLowerCase()===WEBSITE_COLOR} onClick={()=>onChange(WEBSITE_COLOR)} title="使用官网主色">
      <span style={{backgroundColor:WEBSITE_COLOR}}/>官网色
    </button>
    {COLORS.map(color=><button key={color.value} type="button" className="brand-color-preset" aria-label={color.name} aria-pressed={selected.toLowerCase()===color.value} title={color.name} style={{backgroundColor:color.value}} onClick={()=>onChange(color.value)}/>)}
    <label className="brand-color-custom-label" title="自定义颜色"><input type="color" className="brand-color-custom" aria-label="自定义主色调" value={selected} onChange={e=>onChange(e.target.value)}/><span>自选</span></label>
  </div>
}
