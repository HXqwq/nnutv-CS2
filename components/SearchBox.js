"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [value, setValue] = useState("");
  const router = useRouter();

  return (
    <form
      className="search-box"
      onSubmit={(e) => {
        e.preventDefault();
        const t = value.trim();
        router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
        // 已在 /search 页时路由不会重挂载组件，用事件同步关键词
        window.dispatchEvent(new CustomEvent("nnutv-search", { detail: t }));
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索选手 / 战队 / 比赛"
        aria-label="站内搜索"
      />
      <button type="submit">搜索</button>
    </form>
  );
}
