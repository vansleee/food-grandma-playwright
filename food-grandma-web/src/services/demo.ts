import { unwrap } from "./http";

export interface DemoSummary {
  status: string;
  restaurants: number;
  meals: number;
  orders: number;
}
export async function resetAndSeedDemoData(): Promise<DemoSummary> {
  const key = window.prompt("管理者專用：請輸入重設金鑰。金鑰不會儲存在瀏覽器。");
  if (!key) throw new Error("已取消管理者重設。");
  const result = await fetch("/api/test/rebuild", { method: "POST", headers: { "X-Demo-Reset-Key": key } }).then(
    (res) => unwrap<DemoSummary>(res),
  );
  if (result.status !== "seeded") throw new Error("重建示範資料失敗。");
  return result;
}
