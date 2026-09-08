import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NNUTV ",
  description: "Nanjing Normal University Counter-Strike News",
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
          联系作者：QQ(3605177574)
        </footer>
      </body>
    </html>
  );
}
