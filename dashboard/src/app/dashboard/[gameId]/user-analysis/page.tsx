"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import { DashboardContext } from "../layout";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TextField, Autocomplete } from "@mui/material";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function getTrend(current: number, prev: number, strictType?: boolean): { change: string; trend: 'up' | 'down' | undefined } {
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

export default function UserAnalysisPage() {
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
          `${apiUrl}/api/metrics/user-analysis/${gameId}?${params}`,
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

  // Metric Cards
  const cards = [
    {
      title: "Total Users",
      value: data.lifecycle.totalUsers.toLocaleString(),
      ...getTrend(data.lifecycle.totalUsers, data.lifecycle.totalUsersPrev ?? 0, true)
    },
    {
      title: "New Users",
      value: data.segmentation.newUsers.toLocaleString(),
      ...getTrend(data.segmentation.newUsers, data.segmentation.newUsersPrev ?? 0, true)
    },
    {
      title: "Paying Users",
      value: data.segmentation.payingUsers.toLocaleString(),
      ...getTrend(data.segmentation.payingUsers, data.segmentation.payingUsersPrev ?? 0, true)
    },
    {
      title: "Avg. Session Duration",
      value: `${Math.round(data.behavior.avgSessionDuration / 60)} min`,
      ...getTrend(data.behavior.avgSessionDuration, data.behavior.avgSessionDurationPrev ?? 0, true)
    },
    {
      title: "Avg. Sessions/User",
      value: data.behavior.avgSessionsPerUser.toFixed(1),
      ...getTrend(data.behavior.avgSessionsPerUser, data.behavior.avgSessionsPerUserPrev ?? 0, true)
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">User Analysis</h1>
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

      {/* Demographics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Country Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2 text-gray-700">Country Distribution</h3>
          {data.demographics.countryDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.demographics.countryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="user_count" />
                <YAxis type="category" dataKey="country" width={80} />
                <Tooltip />
                <Bar dataKey="user_count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2 text-gray-700">Platform Distribution</h3>
          {data.demographics.platformDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.demographics.platformDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="user_count" />
                <YAxis type="category" dataKey="platform" width={80} />
                <Tooltip />
                <Bar dataKey="user_count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2 text-gray-700">Device Distribution</h3>
          {data.demographics.deviceDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.demographics.deviceDistribution.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="deviceModel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="user_count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User Lifecycle Metrics */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-4 text-gray-700">User Lifecycle Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avg. Playtime</div>
            <div className="text-xl font-semibold text-gray-800">{Math.round(data.lifecycle.avgPlaytime / 60)} min</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avg. Purchases</div>
            <div className="text-xl font-semibold text-gray-800">{data.lifecycle.avgPurchases.toFixed(1)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avg. Spent</div>
            <div className="text-xl font-semibold text-gray-800">${data.lifecycle.avgSpent.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avg. Sessions</div>
            <div className="text-xl font-semibold text-gray-800">{data.lifecycle.avgSessions.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 