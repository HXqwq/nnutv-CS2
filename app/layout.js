import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NNUTV CS2 · Counter-Strike News",
  description: "南京师范大学 CS2 · BLION 电竞社",
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/matches", label: "比赛" },
  { href: "/players", label: "选手" },
  { href: "/teams", label: "战队" },
  { href: "/rankings", label: "排行榜" },
  { href: "/events", label: "赛事" },
  { href: "/stats", label: "Stats" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="logo" href="/">
              NNUTV<span className="sub">CS2</span>
            </Link>
            <nav>
              {navItems.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          NNUTV CS2 Data Site ·
          联系作者 <a href="#">QQ 3605177574</a>
        </footer>
      </body>
    </html>
  );
}
