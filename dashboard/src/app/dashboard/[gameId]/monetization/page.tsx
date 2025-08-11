"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import { DashboardContext } from "../layout";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { TextField, Autocomplete } from "@mui/material";

function getTrend(current: number, prev: number) {
  current = isNaN(current) || current == null ? 0 : current;
  prev = isNaN(prev) || prev == null ? 0 : prev;
  if (prev === 0 && current === 0) return { change: "0%", trend: "up" };
  if (prev === 0 && current > 0) return { change: "+100%", trend: "up" };
  if (prev === 0) return { change: "0%", trend: "up" };
  const diff = current - prev;
  const percent = ((diff / prev) * 100).toFixed(1);
  return {
    change: (diff >= 0 ? "+" : "") + percent + "%",
    trend: diff >= 0 ? "up" : "down"
  };
}

function normalizeSummary(summary: any) {
  if (!summary) return {};
  return {
    totalRevenue: summary.total_revenue,
    arpu: summary.arpu,
    arppu: summary.arppu,
    ltv: summary.ltv,
    purchaseCount: summary.purchase_count,
    conversionRate: summary.conversion_rate,
    payingUsers: summary.paying_users,
    avgRevenuePerPayingUser: summary.avg_revenue_per_paying_user,
    averageTransactionValue: summary.average_transaction_value,
    transactionCount: summary.transaction_count,
    // prev values
    totalRevenuePrev: summary.total_revenue_prev,
    arpuPrev: summary.arpu_prev,
    arppuPrev: summary.arppu_prev,
    ltvPrev: summary.ltv_prev,
    purchaseCountPrev: summary.purchase_count_prev,
    conversionRatePrev: summary.conversion_rate_prev,
    payingUsersPrev: summary.paying_users_prev,
    avgRevenuePerPayingUserPrev: summary.avg_revenue_per_paying_user_prev,
    averageTransactionValuePrev: summary.average_transaction_value_prev,
    transactionCountPrev: summary.transaction_count_prev,
  };
}

export default function MonetizationPage() {
  const { gameId } = useParams();
  const dashboardCtx = useContext(DashboardContext);
  const startDate = dashboardCtx?.dateRange.start.toISOString().slice(0, 10);
  const endDate = dashboardCtx?.dateRange.end.toISOString().slice(0, 10);

  // Filters
  const [country, setCountry] = useState("");
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState("");
  const [device, setDevice] = useState("");
  const [playerIdInput, setPlayerIdInput] = useState("");
  const [playerId, setPlayerId] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [filterOptions, setFilterOptions] = useState({ countries: [], versions: [], platforms: [], devices: [] });

  // Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for trend charts
  const [payingUserTrend, setPayingUserTrend] = useState<any[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!gameId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/metrics/filters/${gameId}`);
        if (!res.ok) throw new Error("Filter API error");
        const opts = await res.json();
        setFilterOptions(opts);
      } catch (e) {
        // fallback: do nothing
      }
    };
    fetchFilterOptions();
  }, [gameId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const params = [
          `startDate=${startDate}`,
          `endDate=${endDate}`,
          country && `country=${country}`,
          version && `version=${version}`,
          platform && `platform=${platform}`,
          playerId && `playerId=${playerId}`,
          device && `device=${device}`
        ].filter(Boolean).join('&');
        const res = await fetch(
          `${apiUrl}/api/metrics/monetization/${gameId}?${params}`,
          {
          headers: {
            'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!res.ok) throw new Error("API error");
        const d = await res.json();
        setData(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchData();
  }, [gameId, startDate, endDate, country, version, platform, playerId, device]);

  useEffect(() => {
    const fetchPayingUserTrend = async () => {
      if (!gameId) return;
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const params = [
          `startDate=${startDate}`,
          `endDate=${endDate}`,
          country && `country=${country}`,
          version && `version=${version}`,
          platform && `platform=${platform}`,
          playerId && `playerId=${playerId}`,
          device && `device=${device}`
        ].filter(Boolean).join('&');
        const res = await fetch(
          `${apiUrl}/api/metrics/monetization/${gameId}/paying-user-trend?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!res.ok) throw new Error("Paying User Trend API error");
        const d = await res.json();
        setPayingUserTrend(d.paying_user_trend || []);
      } catch (e) {
        setPayingUserTrend([]);
      }
    };
    fetchPayingUserTrend();
  }, [gameId, startDate, endDate, country, version, platform, playerId, device]);

  // Player ID: debounce
  const handlePlayerIdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerIdInput(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPlayerId(e.target.value);
    }, 300);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div className="text-gray-500">No data.</div>;

  const { summary, trends, productBreakdown } = data;
  const normalizedSummary = normalizeSummary(summary);

  // Metric Cards
  const rawCards = [
    normalizedSummary.totalRevenue !== undefined && {
      title: "Total Revenue",
      value: normalizedSummary.totalRevenue != null ? `$${normalizedSummary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.totalRevenue, normalizedSummary.totalRevenuePrev),
    },
    normalizedSummary.arpu !== undefined && {
      title: "ARPU",
      value: normalizedSummary.arpu != null ? `$${normalizedSummary.arpu.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.arpu, normalizedSummary.arpuPrev),
    },
    normalizedSummary.arppu !== undefined && {
      title: "ARPPU",
      value: normalizedSummary.arppu != null ? `$${normalizedSummary.arppu.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.arppu, normalizedSummary.arppuPrev),
    },
    normalizedSummary.ltv !== undefined && {
      title: "LTV",
      value: normalizedSummary.ltv != null ? `$${normalizedSummary.ltv.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.ltv, normalizedSummary.ltvPrev),
    },
    normalizedSummary.purchaseCount !== undefined && {
      title: "Purchase Count",
      value: normalizedSummary.purchaseCount != null ? normalizedSummary.purchaseCount.toString() : '0',
      ...getTrend(normalizedSummary.purchaseCount, normalizedSummary.purchaseCountPrev),
    },
    normalizedSummary.conversionRate !== undefined && {
      title: "Conversion Rate",
      value: normalizedSummary.conversionRate != null ? `${normalizedSummary.conversionRate.toFixed(2)}%` : '0%',
      ...getTrend(normalizedSummary.conversionRate, normalizedSummary.conversionRatePrev),
    },
    normalizedSummary.payingUsers !== undefined && {
      title: "Paying Users",
      value: normalizedSummary.payingUsers != null ? normalizedSummary.payingUsers.toString() : '0',
      ...getTrend(normalizedSummary.payingUsers, normalizedSummary.payingUsersPrev),
    },
    normalizedSummary.avgRevenuePerPayingUser !== undefined && {
      title: "Avg. Revenue/Paying User",
      value: normalizedSummary.avgRevenuePerPayingUser != null ? `$${normalizedSummary.avgRevenuePerPayingUser.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.avgRevenuePerPayingUser, normalizedSummary.avgRevenuePerPayingUserPrev),
    },
    normalizedSummary.averageTransactionValue !== undefined && {
      title: "Avg. Transaction Value",
      value: normalizedSummary.averageTransactionValue != null ? `$${normalizedSummary.averageTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      ...getTrend(normalizedSummary.averageTransactionValue, normalizedSummary.averageTransactionValuePrev),
    },
    normalizedSummary.transactionCount !== undefined && {
      title: "Transaction Count",
      value: normalizedSummary.transactionCount != null ? normalizedSummary.transactionCount.toString() : '0',
      ...getTrend(normalizedSummary.transactionCount, normalizedSummary.transactionCountPrev),
    },
  ];
  const cards = rawCards.filter(Boolean).map(card => {
    const c = card as { title: string; value: string; change?: string; trend?: string };
    const validTrend = c.trend === 'up' || c.trend === 'down' ? c.trend : 'up';
    return {
      title: String(c.title),
      value: String(c.value),
      change: typeof c.change === 'string' ? c.change : '0%',
      trend: validTrend as 'up' | 'down',
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Monetization</h1>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Autocomplete
          freeSolo
          options={filterOptions.countries}
          value={country}
          onInputChange={(_, v) => setCountry(v)}
          renderInput={(params) => <TextField {...params} label="Country" size="small" />}
          sx={{ minWidth: 120 }}
        />
        <Autocomplete
          freeSolo
          options={filterOptions.versions}
          value={version}
          onInputChange={(_, v) => setVersion(v)}
          renderInput={(params) => <TextField {...params} label="Game Version" size="small" />}
          sx={{ minWidth: 150 }}
        />
        <Autocomplete
          freeSolo
          options={filterOptions.platforms}
          value={platform}
          onInputChange={(_, v) => setPlatform(v)}
          renderInput={(params) => <TextField {...params} label="Platform" size="small" />}
          sx={{ minWidth: 120 }}
        />
        <Autocomplete
          freeSolo
          options={filterOptions.devices}
          value={device}
          onInputChange={(_, v) => setDevice(v)}
          renderInput={(params) => <TextField {...params} label="Device" size="small" />}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Player ID"
          size="small"
          value={playerIdInput}
          onChange={handlePlayerIdInputChange}
          sx={{ minWidth: 120 }}
        />
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(card => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>
      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="font-semibold mb-2 text-gray-700">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.revenue_chart || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
        </div>
      {/* Paying User Trend Chart */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="font-semibold mb-2 text-gray-700">Paying User Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={payingUserTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="paying_users" stroke="#82ca9d" name="Paying Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Product Breakdown Table */}
      {productBreakdown && productBreakdown.length > 0 && (
      <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-2 font-medium text-gray-700">Product Revenue Breakdown</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-600 border-b">
                  <th className="px-2 py-1 text-left">Product</th>
                  <th className="px-2 py-1 text-left">Revenue</th>
                  <th className="px-2 py-1 text-left">Sales</th>
              </tr>
            </thead>
            <tbody>
                {productBreakdown.map((p: any) => (
                <tr key={p.product_id} className="border-b last:border-0">
                  <td className="px-2 py-1">{p.product_id}</td>
                    <td className="px-2 py-1">${p.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-1">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}