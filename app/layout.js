import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NJNU CS2 社团数据站",
  description: "校内 CS2 社团选手与比赛数据统计",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="logo" href="/">
              NJNU<span>CS2</span>
            </Link>
            <nav>
              <Link href="/">首页</Link>
              <Link href="/matches">比赛</Link>
              <Link href="/players">选手</Link>
              <Link href="/rankings">排行榜</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          数据来源：完美世界电竞平台 · 社团数据组维护 · 示例数据仅用于演示
        </footer>
      </body>
    </html>
  );
}
