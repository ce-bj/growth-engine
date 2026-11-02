import defaults from './config/component-defaults.json'
import type { BlockKind } from './blocks'
import type { Section } from './MarketingStudio'
export function createComponent(kind:BlockKind,id:string=crypto.randomUUID(),title?:string):Section {
 const entry=defaults.find(item=>item.kind===kind)!
 const value=entry.default_instance
 return {id,kind,title:title||value.title,body:'',hidden:!value.visible,columns:typeof value.props.columns==='number'?value.props.columns:undefined}
}
