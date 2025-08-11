 "use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface RealtimeData {
  active_users: number[];
  new_users: number[];
  returning_users: number[];
  revenue: number[];
  transactions: number[];
  session_count: number[];
  hours: string[];
}

const metricInfo = [
  { key: "active_users", title: "Active Users", color: "#2563eb" },
  { key: "new_users", title: "New Users", color: "#22c55e" },
  { key: "returning_users", title: "Returning Users", color: "#a21caf" },
  { key: "revenue", title: "Revenue", color: "#f59e42" },
  { key: "transactions", title: "Transactions", color: "#eab308" },
  { key: "session_count", title: "Session Count", color: "#0ea5e9" },
];

const lineMetrics = ["active_users", "new_users", "returning_users"];
const barMetrics = ["revenue", "transactions", "session_count"];

export default function RealtimePage() {
  const { gameId } = useParams();
  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealtime = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/metrics/realtime/${gameId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        if (!res.ok) throw new Error("API error");
        const d = await res.json();
        setData(d);
      } catch (e) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchRealtime();
    // Optionally, add polling here
    // const interval = setInterval(fetchRealtime, 30000);
    // return () => clearInterval(interval);
  }, [gameId]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div className="text-gray-500">No data.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Realtime</h1>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {metricInfo.map((m) => (
          <MetricCard
            key={m.key}
            title={m.title}
            value={m.key === "revenue"
              ? `$${((data[m.key as keyof RealtimeData] as number[]).reduce((a, b) => Number(a) + Number(b), 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : (data[m.key as keyof RealtimeData] as number[]).reduce((a, b) => Number(a) + Number(b), 0)
            }
            color={m.color}
          />
        ))}
      </div>
      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {metricInfo.map((m) => {
          const chartData = data.hours.map((h, i) => ({
            hour: h.slice(11, 16),
            value: data[m.key as keyof RealtimeData][i] || 0
          }));
          const yLabel = m.key === 'revenue' ? 'Revenue ($)' : m.key === 'transactions' ? 'Transactions' : m.key === 'session_count' ? 'Session Count' : 'User Count';
          return (
            <div key={m.key} className="bg-white rounded-xl shadow p-6">
              <div className="mb-2 font-semibold text-gray-900">{m.title} (Last 24h, Hourly)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {lineMetrics.includes(m.key) ? (
                    <LineChart data={chartData} margin={{ left: 50, right: 10, top: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" angle={-45} textAnchor="end" interval={2} height={60} />
                      <YAxis label={{ value: yLabel, angle: -90, position: 'outsideLeft', dx: -10 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke={m.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ left: 50, right: 10, top: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" angle={-45} textAnchor="end" interval={2} height={60} />
                      <YAxis label={{ value: yLabel, angle: -90, position: 'outsideLeft', dx: -10 }} allowDecimals={m.key === 'revenue'} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill={m.color} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
      <div className="text-gray-500 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
