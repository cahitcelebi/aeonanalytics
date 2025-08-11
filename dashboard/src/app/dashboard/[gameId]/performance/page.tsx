"use client";
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { DashboardContext } from "../layout";
import { TextField, Autocomplete } from "@mui/material";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

function formatPercent(val: number | null | undefined) {
  if (val == null || isNaN(val)) return "—";
  return val.toFixed(2) + "%";
}

function formatDuration(val: number) {
  if (!val) return "0 min";
  return `${Math.round(val / 60)} min`;
}

export default function PerformancePage() {
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
    async function fetchData() {
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
          `${apiUrl}/api/metrics/performance/${gameId}?${params}`,
          {
          headers: {
            'Authorization': `Bearer ${token}`
          }
          }
        );
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error || 'An error occurred while loading data.');
          setData(null);
        setLoading(false);
          return;
        }
        setData(json);
      } catch (err: any) {
        setError('Network or server error.');
        setData(null);
      }
      setLoading(false);
    }
    if (gameId && startDate && endDate) fetchData();
  }, [gameId, startDate, endDate, country, version, platform, playerId, device]);

  // Player ID: debounce
  const handlePlayerIdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerIdInput(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPlayerId(e.target.value);
    }, 300);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-red-500">No data</div>;

  // Trend ve table verilerinde duplicate'ları filtrele
  function uniqueBy<T>(arr: T[], key: keyof T): T[] {
    return Array.from(new Map(arr.map(item => [item[key], item])).values());
  }
  const crashTrend = uniqueBy(data.crashTrend || [], 'date');
  const errorTrend = uniqueBy(data.errorTrend || [], 'date');
  const deviceCrashTable = uniqueBy(data.deviceCrashTable || [], 'device');
  const platformCrashTable = uniqueBy(data.platformCrashTable || [], 'platform');

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Crash Rate" 
          value={formatPercent(data.crashRate)} 
          prevValue={formatPercent(data.prev.crashRate)}
          change={formatPercent(data.crashRate - data.prev.crashRate)}
          trend={data.crashRate - data.prev.crashRate > 0 ? 'up' : data.crashRate - data.prev.crashRate < 0 ? 'down' : undefined}
        />
        <MetricCard 
          title="Error Rate" 
          value={formatPercent(data.errorRate)} 
          prevValue={formatPercent(data.prev.errorRate)}
          change={formatPercent(data.errorRate - data.prev.errorRate)}
          trend={data.errorRate - data.prev.errorRate > 0 ? 'up' : data.errorRate - data.prev.errorRate < 0 ? 'down' : undefined}
        />
        <MetricCard 
          title="Avg. Session Duration" 
          value={formatDuration(data.avgSessionDuration)} 
          prevValue={formatDuration(data.prev.avgSessionDuration)}
          change={formatDuration(data.avgSessionDuration - data.prev.avgSessionDuration)}
          trend={data.avgSessionDuration - data.prev.avgSessionDuration > 0 ? 'up' : data.avgSessionDuration - data.prev.avgSessionDuration < 0 ? 'down' : undefined}
        />
      </div>
      {/* Crash Trend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Crash Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={crashTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString()} angle={-35} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#FF8042" name="Crashes" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Error Trend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Error Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={errorTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString()} angle={-35} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Device Crash Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Device Crash Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="px-2 py-1 text-left">Device</th>
                <th className="px-2 py-1 text-left">Crash Count</th>
              </tr>
            </thead>
            <tbody>
              {(deviceCrashTable.length === 0) ? (
                <tr>
                  <td colSpan={2} className="text-center text-gray-400 py-6">No data</td>
                </tr>
              ) : (
                deviceCrashTable.map((row: any, i: number) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-2 py-1 text-gray-700">{row.device || "Unknown"}</td>
                    <td className="px-2 py-1 text-gray-700">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Platform Crash Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Platform Crash Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="px-2 py-1 text-left">Platform</th>
                <th className="px-2 py-1 text-left">Crash Count</th>
              </tr>
            </thead>
            <tbody>
              {(platformCrashTable.length === 0) ? (
                <tr>
                  <td colSpan={2} className="text-center text-gray-400 py-6">No data</td>
                </tr>
              ) : (
                platformCrashTable.map((row: any, i: number) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-2 py-1 text-gray-700">{row.platform || "Unknown"}</td>
                    <td className="px-2 py-1 text-gray-700">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 