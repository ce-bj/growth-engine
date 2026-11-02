import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const base='docs/open-design-reuse/upstream/plugins/_official/scenarios/od-next-strategy/assets/'
const rules=[]
async function extract(file,start,end,id) {
  const source=base+file
  const text=await readFile(path.join(root,source),'utf8')
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length)
  if(a<0||b<0)throw new Error(`OpenDesign prompt anchors missing: ${id}`)
  rules.push({id,source,sourceVersion:text.split('\n')[0].replace(/^# /,''),sha256:createHash('sha256').update(text).digest('hex'),text:text.slice(a,b).trim()})
}
await extract('core-system-prompt.md','Use only inputs that are present.','Contract and run-state boundaries:','input-fidelity')
await extract('general-orchestration.md','The draft makes the scope and authority of assets and references explicit,','The draft must retain every hard field','design-spec')
await extract('task-profiles/marketing.md','### Establish a communication focus recognizable at first glance','### Make visuals serve the copy','message-hierarchy')
await extract('task-profiles/marketing.md','- The key visual must align semantically','- **Licensed-asset boundary','visual-copy-fit')
await extract('task-profiles/marketing.md','### Keep brand and subjects intact','### Fit the publishing channel','brand-fidelity')
await extract('task-profiles/marketing.md','- At most two typefaces per asset;','- For ad placement assets','readability-and-cta')
await extract('task-profiles/marketing.md','### Avoid templated AI visuals','- **Style-direction inference examples:','anti-cliche')
const output=path.join(root,'src/pages/studio/prompts/open-design.marketing.json')
await mkdir(path.dirname(output),{recursive:true})
await writeFile(output,JSON.stringify({adapterVersion:'growth-opendesign-v1',license:'Apache-2.0',licenseSource:'docs/open-design-reuse/source-excerpts/LICENSE',rules},null,2)+'\n')
