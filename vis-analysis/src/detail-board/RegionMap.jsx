import { Base, G2, register } from "@ant-design/plots";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import { fmtInt } from "../funnel-review/data.js";

Object.entries(G2.geolib()).forEach(([key, component]) => register(key, component));

const ANTARCTICA = "010";
/** 台湾按中国统计和着色。 */
const SAME_AS = { 158: "156" };
const LAND = feature(world, world.objects.countries).features.filter((item) => item.id !== ANTARCTICA);
const COLOR_RANGE = ["#d4e9f4", "#155a7d"];

export default function RegionMap({ countries, height }) {
  const byId = new Map(countries.map((item) => [item.isoId, item]));
  const visited = [];
  const blank = [];
  LAND.forEach((item) => {
    const hit = byId.get(SAME_AS[item.id] ?? item.id);
    if (hit) visited.push({ ...item, properties: { name: hit.country, pv: hit.pv } });
    else blank.push(item);
  });
  const maxPv = Math.max(...countries.map((item) => item.pv), 1);

  const config = {
    type: "geoView",
    height,
    containerStyle: { height },
    autoFit: true,
    margin: 0,
    padding: 0,
    coordinate: { type: "equalEarth" },
    legend: false,
    children: [
      {
        type: "geoPath",
        data: blank,
        style: { fill: "#e8edf1", stroke: "#fff", lineWidth: 0.5 },
        tooltip: false,
      },
      {
        type: "geoPath",
        data: visited,
        encode: { color: (d) => d.properties.pv },
        scale: { color: { type: "sqrt", domain: [0, maxPv], range: COLOR_RANGE } },
        style: { stroke: "#fff", lineWidth: 0.6 },
        state: { active: { stroke: "#0b3b54", lineWidth: 1.2 } },
        tooltip: {
          title: () => "浏览次数(PV)",
          items: [(d) => ({ name: d.properties.name, value: fmtInt(d.properties.pv) })],
        },
      },
    ],
  };
  return (
    <>
      <Base {...config} />
      <div className="db-map-legend" aria-hidden="true">
        <span>浏览次数(PV)</span>
        <span>0</span>
        <i style={{ background: `linear-gradient(90deg, ${COLOR_RANGE.join(", ")})` }} />
        <span>{fmtInt(maxPv)}</span>
      </div>
    </>
  );
}
