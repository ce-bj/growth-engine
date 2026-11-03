// Bundle each *.test.ts with esbuild (extensionless imports, JSON, "@/" alias), then run them with node --test.
import {build} from 'esbuild'
import {spawnSync} from 'node:child_process'
import {mkdtemp,readdir,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const dir=path.join(root,'src/pages/studio')
const tests=(await readdir(dir)).filter(name=>name.endsWith('.test.ts'))
const out=await mkdtemp(path.join(tmpdir(),'marketing-tests-'))
try {
  await build({entryPoints:tests.map(name=>path.join(dir,name)),outdir:out,bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},
    alias:{'@':path.join(root,'src')},packages:'external',logLevel:'warning'})
  const files=(await readdir(out)).filter(name=>name.endsWith('.mjs')).map(name=>path.join(out,name))
  // Tests read repository files relative to the package root.
  const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit',cwd:root})
  process.exitCode=result.status??1
} finally {
  await rm(out,{recursive:true,force:true})
}
