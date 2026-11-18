const fs = require("fs")
const path = require("path")

const [src, dest, win, channel] = process.argv.slice(2)
const text = fs.readFileSync(src, "utf8")
const line = text.split(/\r?\n/).find((row) => row.startsWith("|") && !row.includes("---") && !row.startsWith("| a ") && !row.startsWith("| bytes"))
if (!line) {
  console.error("no data row")
  process.exit(1)
}
const cells = line.split("|").slice(1, -1).map((cell) => cell.trim()).filter(Boolean)
const raw = Buffer.from(cells.join(""), "base64").toString("utf8")
const rows = raw.split("~").map((item) => item.trim()).filter(Boolean)
const tagged = (channel === "raw"
  ? rows
  : channel === "keep"
    ? rows.map((item) => `${win}\t${item}`)
    : rows.map((item) => `${win}\t${channel}\t${item}`)).join("\n") + "\n"
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.appendFileSync(dest, tagged)
console.log(JSON.stringify({ cells: cells.map((cell) => cell.length), rows: rows.length, sample: rows.find((item) => item.startsWith("/\t")) || rows[0] }))
