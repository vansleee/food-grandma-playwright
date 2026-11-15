import PageHeader from "../components/PageHeader";
import { useResource } from "../hooks/useResource";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";

const COLORS = ["#a14e38", "#43675c", "#bf945d", "#8b7ba5"];

export default function Report() {
  const { data: report, error, reload } = useResource(api.getReport);
  if (error)
    return (
      <div className="alert" role="alert">
        {error}
        <button className="btn-secondary" onClick={reload}>
          重新載入
        </button>
      </div>
    );
  if (!report) return <p role="status">正在載入營運報表…</p>;

  const revenueData = report.weekday_labels.map((label, i) => ({
    label,
    value: report.revenue[i],
  }));
  const ordersData = report.weekday_labels.map((label, i) => ({
    label,
    value: report.order_counts[i],
  }));
  const mealData = report.meal_labels.map((label, i) => ({
    name: label,
    value: report.meal_data[i],
  }));
  const driverData = report.driver_labels.map((label, i) => ({
    name: label,
    value: report.driver_data[i],
  }));

  return (
    <div>
      <PageHeader
        title="營運報表"
        description="從每一份訂單，看見這週的經營成果。"
      />
      <div className="report-grid">
        <div className="card" data-testid="revenue-chart">
          <h4>本週營收</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" data-testid="orders-chart">
          <h4>每日訂單數</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={COLORS[1]} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" data-testid="meals-chart">
          <h4>熱門餐點</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={mealData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {mealData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" data-testid="drivers-chart">
          <h4>配送夥伴</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={driverData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {driverData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
