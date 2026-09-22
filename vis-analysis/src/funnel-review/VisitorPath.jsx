import { fmtInt } from "./data.js";

function Steps({ types, compact }) {
  return (
    <ol className={`walk-steps${compact ? " is-compact" : ""}`}>
      {types.map((type, index) => (
        <li key={`${type}-${index}`}>
          {index ? <span className="walk-arr" aria-hidden="true">→</span> : null}
          <span className="walk-chip">{type}</span>
        </li>
      ))}
    </ol>
  );
}

function PageCard({ page, step }) {
  return (
    <article className="walk-page">
      <span className="walk-page-i">{step}</span>
      <dl>
        <div>
          <dt>Title（TDK）</dt>
          <dd>{page.title}</dd>
        </div>
        <div>
          <dt>页面类型</dt>
          <dd>{page.type}</dd>
        </div>
        <div>
          <dt>URL</dt>
          <dd>
            <code>{page.url}</code>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function WalkDetail({ walk }) {
  if (!walk) return null;
  if (!walk.urls.length) {
    return (
      <div className="walk-detail">
        <p className="path-note">这条走法散在很多具体页上，没有哪一组 URL 满 5 人。</p>
      </div>
    );
  }
  return (
    <div className="walk-detail">
      {walk.mix.length > 1 ? (
        <p className="walk-mix-line">
          走过这条的人：
          {walk.mix.map((item, index) => (
            <span key={item.id}>
              {index ? " · " : null}
              {item.name} {fmtInt(item.count)}
            </span>
          ))}
        </p>
      ) : null}
      {walk.urls.map((row, combo) => (
        <section
          key={row.pages.map((page) => page.path).join(">")}
          className="walk-combo"
        >
          <p className="walk-combo-k">
            {walk.urls.length > 1 ? `具体页 ${combo + 1}` : "具体页"}
            {` · ${fmtInt(row.count)} 人`}
          </p>
          <ol className="walk-page-chain">
            {row.pages.map((page, index) => (
              <li key={`${page.path}-${index}`}>
                {index ? (
                  <span className="walk-page-arr" aria-hidden="true">
                    ↓
                  </span>
                ) : null}
                <PageCard page={page} step={index + 1} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export { Steps };
