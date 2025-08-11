"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "next/navigation";
import { MenuItem, Select, TextField, InputLabel, FormControl, Autocomplete } from '@mui/material';
import { DashboardContext } from "../layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from "@/components/dashboard/metrics/MetricCard";

interface RetentionCurvePoint {
  day: number;
  rate: number;
}

function getTrend(current: number, prev: number): { change: string; trend: "up" | "down" } {
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

// Helper to format seconds as Xm Ys
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0m 0s";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s`;
}

export default function EngagementPage() {
  const { gameId } = useParams();
  const dashboardCtx = useContext(DashboardContext);
  const startDate = dashboardCtx?.dateRange.start.toISOString().slice(0, 10);
  const endDate = dashboardCtx?.dateRange.end.toISOString().slice(0, 10);
  const [data, setData] = useState<{
    retention: { day1: number; day7: number; day30: number };
    returningUsers: number;
    churnRate: number;
    avgSessionDuration: number;
    retentionCurve: RetentionCurvePoint[];
    // Previous period data for trends
    retentionPrev: { day1: number; day7: number; day30: number };
    returningUsersPrev: number;
    churnRatePrev: number;
    avgSessionDurationPrev: number;
    cohortTable: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [countryInput, setCountryInput] = useState('');
  const [versionInput, setVersionInput] = useState('');
  const [platformInput, setPlatformInput] = useState('');
  const [deviceInput, setDeviceInput] = useState('');
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [country, setCountry] = useState('');
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('');
  const [device, setDevice] = useState('');
  const [playerId, setPlayerId] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    versions: [],
    platforms: [],
    devices: []
  });

  useEffect(() => {
    const fetchEngagement = async () => {
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
        const res = await fetch(`${apiUrl}/api/metrics/engagement/${gameId}?${params}`, {
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
    if (gameId) fetchEngagement();
  }, [gameId, startDate, endDate, country, version, platform, playerId, device]);

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
        console.error("Filter options fetch error", e);
      }
    };
    fetchFilterOptions();
  }, [gameId]);

  // Filter handlers
  const handleCountryChange = (e: any) => setCountry(e.target.value);
  const handleVersionChange = (e: any) => setVersion(e.target.value);
  const handlePlatformChange = (e: any) => setPlatform(e.target.value);
  const handleDeviceChange = (e: any) => setDevice(e.target.value);
  const handlePlayerIdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerIdInput(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPlayerId(e.target.value);
    }, 300);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div className="text-gray-500">No data available.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Engagement</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Day 1 Retention" 
          value={`${isNaN(data?.retention?.day1) ? 0 : data.retention.day1}%`} 
          change={getTrend(isNaN(data?.retention?.day1) ? 0 : data.retention.day1, isNaN(data?.retentionPrev?.day1) ? 0 : (data.retentionPrev?.day1 ?? 0)).change}
          trend={getTrend(isNaN(data?.retention?.day1) ? 0 : data.retention.day1, isNaN(data?.retentionPrev?.day1) ? 0 : (data.retentionPrev?.day1 ?? 0)).trend}
        />
        <MetricCard 
          title="Day 7 Retention" 
          value={`${isNaN(data?.retention?.day7) ? 0 : data.retention.day7}%`} 
          change={getTrend(isNaN(data?.retention?.day7) ? 0 : data.retention.day7, isNaN(data?.retentionPrev?.day7) ? 0 : (data.retentionPrev?.day7 ?? 0)).change}
          trend={getTrend(isNaN(data?.retention?.day7) ? 0 : data.retention.day7, isNaN(data?.retentionPrev?.day7) ? 0 : (data.retentionPrev?.day7 ?? 0)).trend}
        />
        <MetricCard 
          title="Day 30 Retention" 
          value={`${isNaN(data?.retention?.day30) ? 0 : data.retention.day30}%`} 
          change={getTrend(isNaN(data?.retention?.day30) ? 0 : data.retention.day30, isNaN(data?.retentionPrev?.day30) ? 0 : (data.retentionPrev?.day30 ?? 0)).change}
          trend={getTrend(isNaN(data?.retention?.day30) ? 0 : data.retention.day30, isNaN(data?.retentionPrev?.day30) ? 0 : (data.retentionPrev?.day30 ?? 0)).trend}
        />
        <MetricCard 
          title="Returning Users" 
          value={isNaN(data?.returningUsers) ? "0" : data.returningUsers.toString()}
          change={getTrend(isNaN(data?.returningUsers) ? 0 : data.returningUsers, isNaN(data?.returningUsersPrev) ? 0 : (data.returningUsersPrev ?? 0)).change}
          trend={getTrend(isNaN(data?.returningUsers) ? 0 : data.returningUsers, isNaN(data?.returningUsersPrev) ? 0 : (data.returningUsersPrev ?? 0)).trend}
        />
        <MetricCard 
          title="Churn Rate" 
          value={`${isNaN(data?.churnRate) ? 0 : data.churnRate}%`}
          change={getTrend(isNaN(data?.churnRate) ? 0 : data.churnRate, isNaN(data?.churnRatePrev) ? 0 : (data?.churnRatePrev ?? 0)).change}
          trend={getTrend(isNaN(data?.churnRate) ? 0 : data.churnRate, isNaN(data?.churnRatePrev) ? 0 : (data?.churnRatePrev ?? 0)).trend}
        />
        <MetricCard 
          title="Avg. Session Duration" 
          value={formatDuration(data?.avgSessionDuration) as string}
          change={getTrend(isNaN(data?.avgSessionDuration) ? 0 : data.avgSessionDuration, isNaN(data?.avgSessionDurationPrev) ? 0 : (data?.avgSessionDurationPrev ?? 0)).change}
          trend={getTrend(isNaN(data?.avgSessionDuration) ? 0 : data.avgSessionDuration, isNaN(data?.avgSessionDurationPrev) ? 0 : (data?.avgSessionDurationPrev ?? 0)).trend}
        />
      </div>

      {/* Retention Cohorts Table */}
      {(() => {
        // Sticky bar date range
        const start = dashboardCtx?.dateRange?.start ? new Date(dashboardCtx.dateRange.start) : new Date();
        const end = dashboardCtx?.dateRange?.end ? new Date(dashboardCtx.dateRange.end) : new Date();
        const today = new Date();
        const days: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d).toISOString().slice(0, 10));
        }
        // Map backend cohortTable by cohortDate
        const cohortMap: Record<string, any> = {};
        if (data && data.cohortTable) {
          for (const row of data.cohortTable) {
            cohortMap[row.cohortDate] = row;
          }
        }
        // Helper for color
        function getRetentionColor(val: number | undefined) {
          if (val === undefined || isNaN(val)) return "bg-gray-200 text-gray-400";
          if (val >= 20) return "bg-blue-500 text-white";
          if (val >= 10) return "bg-yellow-400 text-gray-900";
          if (val > 0) return "bg-red-500 text-white";
          return "bg-gray-100 text-gray-400";
        }
        return (
          <div className="bg-white rounded-xl shadow p-6 overflow-auto">
            <div className="mb-4 font-medium text-gray-700">Retention Cohorts Table</div>
            <table className="min-w-full text-xs text-center">
            <thead>
              <tr>
                  <th className="px-2 py-1 border-b font-bold text-gray-900 bg-gray-100">Cohort Date</th>
                  <th className="px-2 py-1 border-b font-bold text-gray-900 bg-gray-100">New Users</th>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <th key={i + 1} className="px-2 py-1 border-b font-bold text-gray-900 bg-gray-100">Day {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
                {days.map((date, idx) => {
                  const row = cohortMap[date];
                  const cohortDate = new Date(date);
                  const maxDay = Math.min(30, Math.floor((today.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <tr key={date} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="px-2 py-1 text-gray-800 font-semibold">{date}</td>
                      <td className="px-2 py-1 text-gray-800 font-semibold">{row ? row.size : 0}</td>
                      {Array.from({ length: 30 }).map((_, i) => {
                        const dayIdx = i + 1;
                        if (dayIdx > maxDay) {
                          return <td key={dayIdx} className="px-2 py-1 bg-gray-100 text-gray-300">-</td>;
                        }
                        const val = row && row[`day${dayIdx}`] !== undefined ? row[`day${dayIdx}`] : undefined;
                        return (
                          <td key={dayIdx} className={`px-2 py-1 font-semibold ${getRetentionColor(val)}`}>{val !== undefined ? `${val}%` : '-'}</td>
                        );
                      })}
                </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        );
      })()}

      {/* Retention Curve Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 font-medium text-gray-700">Retention Curve</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.retentionCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Days', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Retention Rate (%)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value: number) => [`${value?.toFixed(1)}%`, 'Retention']}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 