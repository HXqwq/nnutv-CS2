import Link from "next/link";
import { rankings, fmt } from "../../lib/data";

const columns = [
  { key: "maps", label: "图数", type: "num" },
  { key: "kills", label: "K", type: "num" },
  { key: "deaths", label: "D", type: "num" },
  { key: "assists", label: "A", type: "num" },
  { key: "kd", label: "K/D", type: "num", fmt: (v) => fmt(v) },
  { key: "avgAdr", label: "ADR", type: "num", fmt: (v) => fmt(v, 1) },
  { key: "avgHs", label: "HS%", type: "num", fmt: (v) => fmt(v, 1) },
  { key: "avgRating", label: "Rating", type: "num", fmt: (v) => fmt(v) },
];

export default function RankingsPage() {
  const rows = rankings();

  return (
    <div>
      <h1 className="page-title">选手排行榜</h1>
      <section className="panel">
        {rows.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table className="tbl" id="rank-table">
            <thead>
              <tr>
                <th className="no-sort">#</th>
                <th className="no-sort">选手</th>
                <th className="no-sort">队伍</th>
                {columns.map((c) => (
                  <th key={c.key} data-key={c.key} className={c.type}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player.id}>
                  <td className="muted rank-cell">{i + 1}</td>
                  <td>
                    <Link href={`/players/${r.player.id}`}>{r.player.nickname}</Link>
                  </td>
                  <td className="muted">{r.player.team}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="num" data-key={c.key}>
                      {c.fmt ? c.fmt(r[c.key]) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="muted" style={{ fontSize: 12 }}>
        提示：点击表头可按该列排序。Rating 与 ADR 目前为平台搬运数据的平均值，后续可替换为自算的 HLTV Rating 2.0。
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  var table = document.getElementById('rank-table');
  if (!table) return;
  var ths = table.querySelectorAll('th[data-key]');
  ths.forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-key');
      var tbody = table.querySelector('tbody');
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      var asc = th.getAttribute('data-asc') === '1';
      ths.forEach(function (t) { t.removeAttribute('data-asc'); });
      th.setAttribute('data-asc', asc ? '0' : '1');
      rows.sort(function (a, b) {
        var av = parseFloat(a.querySelector('td[data-key="' + key + '"]').textContent);
        var bv = parseFloat(b.querySelector('td[data-key="' + key + '"]').textContent);
        if (isNaN(av)) av = -Infinity;
        if (isNaN(bv)) bv = -Infinity;
        return asc ? av - bv : bv - av;
      });
      rows.forEach(function (r, i) {
        tbody.appendChild(r);
        r.querySelector('.rank-cell').textContent = i + 1;
      });
    });
  });
})();
`,
        }}
      />
    </div>
  );
}
