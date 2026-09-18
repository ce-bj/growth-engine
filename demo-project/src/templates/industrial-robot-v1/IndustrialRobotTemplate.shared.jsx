export function LayerTag({ layer }) {
  const cls = { A: "layer-a", B: "layer-b", C: "layer-c", D: "layer-d" }[layer] || "layer-b";
  return <span className={`layer-tag ${cls}`}>{layer}</span>;
}
