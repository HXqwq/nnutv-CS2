// 比赛状态判定（纯函数，服务端/客户端组件都能 import）
// 注意：不要放进 lib/data.js —— 那个模块读 fs，客户端组件引用会打包报错
//
// status 取值：
//   "scheduled" —— 未开赛：无比分、无地图数据，列表和详情页显示「即将开始」
//   缺省（undefined）—— 已完赛/已有数据，按原来的比分显示
export function isScheduled(match) {
  return !!match && match.status === "scheduled";
}
