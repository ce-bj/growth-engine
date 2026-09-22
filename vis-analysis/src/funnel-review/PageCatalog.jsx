import { useEffect, useMemo, useRef, useState } from "react";
import {
  PAGE_CATALOG_COLS,
  PAGE_ID_COLS,
  PAGE_METRIC_GROUPS,
  catalogRows,
  fmtInt,
  pct,
} from "./data.js";

function copyText(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  if (ok) return Promise.resolve();
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("copy failed"));
}

function UrlCell({ value }) {
  const [copied, setCopied] = useState(false);
  const lastClick = useRef(0);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  function copyNow() {
    window.getSelection()?.removeAllRanges();
    copyText(value);
    setCopied(true);
  }

  function onClick(ev) {
    const now = Date.now();
    if (now - lastClick.current < 450) {
      ev.preventDefault();
      lastClick.current = 0;
      copyNow();
      return;
    }
    lastClick.current = now;
  }

  return (
    <button
      type="button"
      className={`page-url${copied ? " is-copied" : ""}`}
      title={copied ? "已复制" : `${value}（双击复制）`}
      onClick={onClick}
      onDoubleClick={(ev) => {
        ev.preventDefault();
        copyNow();
      }}
    >
      {value}
    </button>
  );
}

function formatCell(col, row) {
  const v = row[col.key];
  if (col.fmt === "url") {
    if (!v) return "—";
    return <UrlCell value={v} />;
  }
  if (v == null || v === "") return "—";
  if (col.fmt === "pct") {
    const text = pct(v);
    if (col.prevKey && row[col.prevKey] != null) {
      const dpp = (v - row[col.prevKey]) * 100;
      const sign = dpp > 0 ? "+" : "";
      return (
        <>
          {text}
          <small className="delta">
            {sign}
            {dpp.toFixed(1)}pp
          </small>
        </>
      );
    }
    return text;
  }
  if (col.fmt === "sec") return `${v}秒`;
  if (typeof v === "number") return fmtInt(v);
  return v;
}

const SLICE_HINT = {
  page: "主键是页面名称。这一页在浏览、转化、留资各层的数都在这张表。",
  land: "主键仍是页面名称，只收进站第一页口径：秒退、落地接住、落地停留。",
};

function catalogKeys(slice) {
  return PAGE_CATALOG_COLS[slice].map((col) => col.key);
}

function colSortable(col) {
  return col.key !== "name" && col.fmt !== "url" && col.key !== "type";
}

function cycleSort(prev, key) {
  if (!prev || prev.key !== key) return { key, dir: "desc" };
  if (prev.dir === "desc") return { key, dir: "asc" };
  return null;
}

function sortedRows(rows, sort) {
  if (!sort) return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const aMiss = av == null || av === "";
    const bMiss = bv == null || bv === "";
    if (aMiss && bMiss) return 0;
    if (aMiss) return 1;
    if (bMiss) return -1;
    const d = av - bv;
    return sort.dir === "asc" ? d : -d;
  });
  return copy;
}

function SortCarets({ dir }) {
  return (
    <span className={`sort-carets${dir ? ` is-${dir}` : ""}`} aria-hidden="true">
      <i className="sort-caret is-up" />
      <i className="sort-caret is-down" />
    </span>
  );
}

function MetricPicker({ slice, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const cols = PAGE_CATALOG_COLS[slice];
  const groups = PAGE_METRIC_GROUPS[slice];
  const allKeys = catalogKeys(slice);
  const visibleCount = cols.filter((col) => selected.has(col.key)).length;

  useEffect(() => {
    setOpen(false);
  }, [slice]);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function toggle(key) {
    const next = new Set(allKeys.filter((item) => selected.has(item)));
    if (next.has(key)) {
      if (next.size <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  }

  return (
    <div className="metric-picker" ref={boxRef}>
      <button
        type="button"
        className={`metric-picker__btn${open ? " is-on" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        选择指标
        <span>
          {visibleCount}/{cols.length}
        </span>
      </button>
      {open ? (
        <div className="metric-picker__menu" role="dialog" aria-label="选择表格指标">
          <div className="metric-picker__actions">
            <button type="button" onClick={() => onChange(new Set(allKeys))}>
              全选
            </button>
            {slice === "page" ? (
              <button
                type="button"
                onClick={() => onChange(new Set(groups[0]?.keys || allKeys.slice(0, 5)))}
              >
                只看浏览
              </button>
            ) : null}
          </div>
          {groups.map((group) => (
            <div key={group.label} className="metric-picker__group">
              <p>{group.label}</p>
              {group.keys.map((key) => {
                const col = cols.find((item) => item.key === key);
                if (!col) return null;
                return (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggle(key)}
                    />
                    {col.label}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PageCatalog({ channelId, intentId }) {
  const [slice, setSlice] = useState("page");
  const [selected, setSelected] = useState(() => new Set(catalogKeys("page")));
  const [sort, setSort] = useState(null);

  function switchSlice(next) {
    setSlice(next);
    setSelected(new Set(catalogKeys(next)));
    setSort(null);
  }

  useEffect(() => {
    setSort(null);
  }, [channelId, intentId]);

  const metricCols = useMemo(
    () => PAGE_CATALOG_COLS[slice].filter((col) => selected.has(col.key)),
    [slice, selected]
  );
  const cols = [...PAGE_ID_COLS, ...metricCols];
  const rows = useMemo(() => {
    const list = catalogRows(slice, channelId, intentId);
    if (sort && !selected.has(sort.key)) return list;
    return sortedRows(list, sort);
  }, [slice, channelId, intentId, sort, selected]);

  return (
    <section className="page-catalog" aria-labelledby="catalog-title">
      <header className="catalog-toolbar">
        <div>
          <p className="kicker" id="catalog-title">
            页面明细
          </p>
          <div className="sub-tabs" role="tablist" aria-label="页面切片">
            <button
              type="button"
              role="tab"
              aria-selected={slice === "page"}
              className={slice === "page" ? "is-on" : ""}
              onClick={() => switchSlice("page")}
            >
              页面概览
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={slice === "land"}
              className={slice === "land" ? "is-on" : ""}
              onClick={() => switchSlice("land")}
            >
              落地页概览
            </button>
          </div>
        </div>
        <MetricPicker slice={slice} selected={selected} onChange={setSelected} />
      </header>
      <p className="slice-hint">{SLICE_HINT[slice]}</p>
      {rows.length ? (
        <div className="table-wrap">
          <table className={`grid is-wide is-catalog${slice === "land" ? " is-land" : ""}`}>
            <colgroup>
              <col className="col-name" />
              <col className="col-url" />
              <col className="col-type" />
              {metricCols.map((c) => (
                <col key={c.key} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {cols.map((c) => {
                  const sortable = colSortable(c);
                  const active = sort?.key === c.key;
                  const dir = active ? sort.dir : null;
                  const className = [
                    c.key === "name" ? "is-name" : "",
                    c.fmt === "url" ? "is-url" : "",
                    sortable ? "is-sort" : "",
                    dir ? `is-${dir}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const nextHint =
                    !dir ? "降序" : dir === "desc" ? "升序" : "取消排序";
                  if (!sortable) {
                    return (
                      <th key={c.key} className={className}>
                        {c.label}
                      </th>
                    );
                  }
                  return (
                    <th
                      key={c.key}
                      className={className}
                      aria-sort={
                        dir === "desc" ? "descending" : dir === "asc" ? "ascending" : "none"
                      }
                    >
                      <button
                        type="button"
                        className="sort-head"
                        title={`${c.label}，点击${nextHint}`}
                        onClick={() => setSort((prev) => cycleSort(prev, c.key))}
                      >
                        <span className="sort-label">{c.label}</span>
                        <SortCarets dir={dir} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.path}>
                  {cols.map((c) => {
                    const numeric =
                      c.fmt === "pct" ||
                      c.fmt === "sec" ||
                      (c.fmt !== "url" && typeof row[c.key] === "number");
                    const className =
                      c.fmt === "url"
                        ? "is-url"
                        : c.key === "name"
                          ? "is-name"
                          : numeric
                            ? "num"
                            : "";
                    const title =
                      c.key === "name" || c.key === "type"
                        ? row[c.key]
                        : undefined;
                    return (
                      <td key={c.key} className={className} title={title}>
                        {formatCell(c, row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">这一视角还没有按页面切片的样例。</p>
      )}
    </section>
  );
}
