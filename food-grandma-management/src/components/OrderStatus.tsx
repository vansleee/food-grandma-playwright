export const statuses = [
  {
    value: "Cooking",
    label: "備餐中",
    tone: "cooking",
    hint: "準備好餐點後，即可通知取餐",
  },
  {
    value: "Ready",
    label: "待取餐",
    tone: "ready",
    hint: "餐點已備妥，等待外送員接單",
  },
  {
    value: "On the way",
    label: "配送中",
    tone: "ontheway",
    hint: "美味正在送往顧客的路上",
  },
  {
    value: "Delivered",
    label: "已送達",
    tone: "delivered",
    hint: "每一份完成，都是一份安心",
  },
];
export default function OrderStatus({ value }: { value: string }) {
  const status = statuses.find((s) => s.value === value);
  return (
    <span
      className={`status-pill status-${status?.tone ?? "unknown"}`}
      title={value}
    >
      {status?.label ?? value}
    </span>
  );
}
