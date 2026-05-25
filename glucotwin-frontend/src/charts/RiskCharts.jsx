// charts/RiskCharts.jsx — Recharts wrappers for GlucoTwin AI
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const tooltipStyle = {
  contentStyle: {
    background: "#0a1628",
    border: "1px solid #1a2e4a",
    borderRadius: 10,
  },
};

export function RiskTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" />
        <XAxis dataKey="name" stroke="#6b8ca8" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6b8ca8" tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone" dataKey="risk"
          stroke="#00d4aa" strokeWidth={3}
          dot={{ fill: "#00d4aa", r: 5 }}
          name="Risk %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GlucoseTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4a" />
        <XAxis dataKey="name" stroke="#6b8ca8" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6b8ca8" tick={{ fontSize: 11 }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="glucose" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Glucose mg/dL" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RiskDistributionPieChart({ data, outerRadius = 75, innerRadius = 50, height = 160 }) {
  return (
    <ResponsiveContainer width={outerRadius * 3} height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AdminPieChart({ data, outerRadius = 90 }) {
  return (
    <ResponsiveContainer width={220} height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          outerRadius={outerRadius}
          dataKey="value"
          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
