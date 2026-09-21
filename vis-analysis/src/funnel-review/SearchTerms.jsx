import { useEffect, useMemo, useState } from "react";
import {
  SEARCH_TERM_COLS,
  SEARCH_TERM_SOURCES,
  fmtInt,
  pct,
  searchTermRows,
} from "./data.js";

function formatCell(col, row) {
  const v = row[col.key];
  if (col.key === "sourceLabel") {
    return <span className={`term-src is-${row.source}`}>{row.sourceLabel}</span>;
  }
  if (v == null || v === "") return "—";
  if (col.fmt === "pct") return pct(v);
  if (col.fmt === "pos") return Number(v).toFixed(1);
  if (col.fmt === "money") return `US$${fmtInt(v)}`;
  if (typeof v === "number") return fmtInt(v);
  return v;
}

function colSortable() {
  return true;
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
    const key = sort.key === "sourceLabel" ? "sourceRank" : sort.key;
    const av = a[key];
    const bv = b[key];
    const aMiss = av == null || av === "";
    const bMiss = bv == null || bv === "";
    if (aMiss && bMiss) return 0;
    if (aMiss) return 1;
    if (bMiss) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      const d = String(av).localeCompare(String(bv), "zh");
      return sort.dir === "asc" ? d : -d;
    }
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

const DEFAULT_SORT = {
  all: { key: "sourceLabel", dir: "asc" },
  site: { key: "searches", dir: "desc" },
  gsc: { key: "clicks", dir: "desc" },
  ads: { key: "clicks", dir: "desc" },
};

export default function SearchTerms({ authMap, onAuthorize, preferSource }) {
  const [source, setSource] = useState(preferSource || "all");
  const [sort, setSort] = useState(DEFAULT_SORT[preferSource] ?? DEFAULT_SORT.all);
  const [hiddenBanners, setHiddenBanners] = useState([]);
  const current = SEARCH_TERM_SOURCES.find((item) => item.key === source) ?? SEARCH_TERM_SOURCES[0];
  const unauthorized =
    current.authKey && authMap && authMap[current.authKey] === false;
  const missing = SEARCH_TERM_SOURCES.filter(
    (item) =>
      item.authKey &&
      authMap &&
      authMap[item.authKey] === false &&
      !hiddenBanners.includes(item.key),
  );

  useEffect(() => {
    if (preferSource) setSource(preferSource);
  }, [preferSource]);

  function switchSource(id) {
    setSource(id);
    setSort(DEFAULT_SORT[id] ?? DEFAULT_SORT.all);
  }

  const cols = SEARCH_TERM_COLS[source] || SEARCH_TERM_COLS.all;
  const rows = useMemo(() => {
    if (unauthorized) return [];
    return sortedRows(searchTermRows(source, authMap), sort);
  }, [source, authMap, sort, unauthorized]);

  return (
    <section className="page-catalog search-terms" aria-labelledby="search-terms-title">
      <header className="catalog-toolbar">
        <div>
          <p className="kicker" id="search-terms-title">
            按搜索词
          </p>
          <div className="sub-tabs" role="tablist" aria-label="搜索词来源">
            {SEARCH_TERM_SOURCES.map((item) => {
              const miss = item.authKey && authMap && authMap[item.authKey] === false;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={source === item.key}
                  className={source === item.key ? "is-on" : ""}
                  onClick={() => switchSource(item.key)}
                >
                  {item.label}
                  {miss ? <em className="term-miss">未授权</em> : null}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <p className="slice-hint">{current.hint}</p>
      {source === "all" && missing.length
        ? missing.map((item) => (
            <div key={item.key} className="auth-banner">
              <span>
                {item.label}未授权，这一来源的搜索词还列不出来。
              </span>
              <div className="auth-banner-actions">
                <button
                  type="button"
                  className="auth-banner-go"
                  onClick={() => onAuthorize?.(item.authKey)}
                >
                  去授权
                </button>
                <button
                  type="button"
                  className="auth-banner-close"
                  aria-label="关闭提示"
                  title="关闭"
                  onClick={() =>
                    setHiddenBanners((prev) =>
                      prev.includes(item.key) ? prev : [...prev, item.key],
                    )
                  }
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </div>
          ))
        : null}
      {unauthorized ? (
        <div className="auth-empty">
          <p className="kicker">未授权</p>
          <h3>{current.label}未授权</h3>
          <p>授权后按搜索词列出点击、展示和花费。不对接到具体访客，也不指定落地页。</p>
          <button type="button" className="auth-jump" onClick={() => onAuthorize?.(current.authKey)}>
            去授权
          </button>
        </div>
      ) : rows.length ? (
        <div className="table-wrap">
          <table className={`grid is-catalog is-terms${source === "all" ? " is-all" : ""}`}>
            <colgroup>
              {cols.map((c) => (
                <col
                  key={c.key}
                  className={
                    c.key === "term" ? "col-term" : c.key === "sourceLabel" ? "col-src" : "col-metric"
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {cols.map((c) => {
                  const sortable = colSortable(c);
                  const active = sort?.key === c.key;
                  const dir = active ? sort.dir : null;
                  const metric = c.key !== "term" && c.key !== "sourceLabel";
                  const className = [
                    c.key === "term" ? "is-name" : "",
                    metric ? "num" : "",
                    sortable ? "is-sort" : "",
                    dir ? `is-${dir}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const nextHint = !dir ? "降序" : dir === "desc" ? "升序" : "取消排序";
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
                <tr key={row.id}>
                  {cols.map((c) => {
                    const numeric = c.fmt === "pct" || c.fmt === "pos" || c.fmt === "money" || typeof row[c.key] === "number";
                    const className =
                      c.key === "term" ? "is-name" : numeric ? "num" : "";
                    return (
                      <td key={c.key} className={className} title={c.key === "term" ? row.term : undefined}>
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
        <p className="empty">这一来源还没有搜索词样例。</p>
      )}
    </section>
  );
}
