"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import DAUChart from "@/components/dashboard/charts/DAUChart";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import RetentionChart from "@/components/dashboard/charts/RetentionChart";
import RevenueByProductChart from '@/components/dashboard/charts/RevenueByProductChart';
import RevenueByPlatformChart from '@/components/dashboard/charts/RevenueByPlatformChart';
import SessionByHourChart from '@/components/dashboard/charts/SessionByHourChart';
import TopEventsChart from '@/components/dashboard/charts/TopEventsChart';
import { MenuItem, Select, TextField, InputLabel, FormControl } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import { DashboardContext } from "../layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

function getTrend(current: number, prev: number) {
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

const metricInfo: Record<string, string> = {
  dau: "Daily Active Users (DAU): Number of unique users who played the game today.",
  wau: "Weekly Active Users (WAU): Number of unique users who played the game in the last 7 days.",
  mau: "Monthly Active Users (MAU): Number of unique users who played the game in the last 30 days.",
  newUsers: "New Users: Number of users who played the game for the first time in the selected period.",
  totalRevenue: "Total Revenue: Sum of all in-app purchases in the selected period.",
  arpu: "ARPU: Average Revenue Per User.",
  arppu: "ARPPU: Average Revenue Per Paying User.",
  conversionRate: "Conversion Rate: Percentage of active users who made a purchase.",
  avgSessionDuration: "Average Session Duration (minutes).",
  avgSessionPerUser: "Average Sessions Per User in the selected period.",
  retention: "Retention (Day 1/7/30): Percentage of users who returned after 1, 7, or 30 days.",
  churnRate: "Churn Rate: Percentage of users who stopped playing the game within 7 days of their last session."
};

export default function OverviewPage() {
  const { gameId } = useParams();
  const dashboardCtx = useContext(DashboardContext);
  const startDate = dashboardCtx?.dateRange.start.toISOString().slice(0, 10);
  const endDate = dashboardCtx?.dateRange.end.toISOString().slice(0, 10);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Temporary filter states (for UI)
  const [countryInput, setCountryInput] = useState('');
  const [versionInput, setVersionInput] = useState('');
  const [platformInput, setPlatformInput] = useState('');
  const [deviceInput, setDeviceInput] = useState('');
  const [playerIdInput, setPlayerIdInput] = useState('');
  // Actual filter states (for API)
  const [country, setCountry] = useState('');
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('');
  const [device, setDevice] = useState('');
  const [playerId, setPlayerId] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Dinamik filtre seçenekleri
  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    versions: [],
    platforms: [],
    devices: []
  });

  // Optionally, you can fetch these options from the backend for dynamic dropdowns
  const countryOptions = ['US', 'FR', 'DE', 'ES', 'TR'];
  const platformOptions = ['iOS', 'Android'];
  const versionOptions = ['1.0.0', '1.1.0', '1.2.0'];
  const deviceOptions = ['Samsung S20', 'Pixel 5', 'iPhone 13', 'iPhone 14', 'OnePlus 7'];

  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData called with:", { country, version, platform, device });
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
          `${apiUrl}/api/metrics/overview/${gameId}?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!res.ok) throw new Error("API error");
        let result;
        try {
          result = await res.json();
        } catch (jsonErr) {
          const text = await res.text();
          console.error("JSON parse error:", jsonErr);
          console.error("Raw response:", text);
          throw new Error("API response is not valid JSON");
        }
        console.log("API response:", result);
        setData(result);
        setTimeout(() => {
          console.log("setData sonrası state:", result);
        }, 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchData();
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

  // ComboBox filters: apply immediately
  const handleCountryChange = (e: any) => {
    console.log("Country changed:", e.target.value);
    setCountry(e.target.value);
  };
  const handleVersionChange = (e: any) => {
    console.log("Version changed:", e.target.value);
    setVersion(e.target.value);
  };
  const handlePlatformChange = (e: any) => {
    console.log("Platform changed:", e.target.value);
    setPlatform(e.target.value);
  };
  const handleDeviceChange = (e: any) => {
    console.log("Device changed:", e.target.value);
    setDevice(e.target.value);
  };

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
  if (!data) return null;

  const { summary, trends, game } = data;
  console.log("Rendered summary:", summary);

  // Only show cards with real data
  const cards = [
    summary.dau !== undefined && {
      title: "DAU",
      value: summary.dau.toString(),
      ...getTrend(summary.dau, summary.dauPrev),
      info: metricInfo.dau
    },
    summary.wau !== undefined && {
      title: "WAU",
      value: summary.wau.toString(),
      ...getTrend(summary.wau, summary.wauPrev),
      info: metricInfo.wau
    },
    summary.mau !== undefined && {
      title: "MAU",
      value: summary.mau.toString(),
      ...getTrend(summary.mau, summary.mauPrev),
      info: metricInfo.mau
    },
    summary.avgSessionDuration !== undefined && {
      title: "Avg. Session Duration",
      value: Math.floor(summary.avgSessionDuration / 60) + "m " + (summary.avgSessionDuration % 60) + "s",
      ...getTrend(summary.avgSessionDuration, summary.avgSessionDurationPrev),
      info: metricInfo.avgSessionDuration
    },
    summary.dailySessions !== undefined && {
      title: "Session Count",
      value: summary.dailySessions.toString(),
      ...getTrend(summary.dailySessions, summary.dailySessionsPrev),
      info: "Total number of sessions in the selected period."
    },
    summary.newUsers !== undefined && {
      title: "New Users (Period)",
      value: summary.newUsers.toString(),
      ...getTrend(summary.newUsers, summary.newUsersPrev),
      info: metricInfo.newUsers
    },
    summary.newUsersToday !== undefined && {
      title: "New Users (Today)",
      value: summary.newUsersToday.toString(),
      change: "",
      trend: "up",
      info: "Number of users who played the game for the first time today."
    },
    summary.avgSessionPerUser !== undefined && {
      title: "Avg. Sessions/User",
      value: summary.avgSessionPerUser.toFixed(2),
      ...getTrend(summary.avgSessionPerUser, summary.avgSessionPerUserPrev),
      info: metricInfo.avgSessionPerUser
    },
    summary.retention && {
      title: "Retention (D1/D7/D30)",
      value: loading ? "Loading..." : `${summary.retention.day1}% / ${summary.retention.day7}% / ${summary.retention.day30}%`,
      info: metricInfo.retention
    },
    summary.totalRevenue !== undefined && {
      title: "Total Revenue",
      value: summary.totalRevenue != null ? `$${summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
      ...getTrend(summary.totalRevenue, summary.totalRevenuePrev),
      info: metricInfo.totalRevenue
    },
    summary.arpu !== undefined && {
      title: "ARPU",
      value: summary.arpu != null ? `$${summary.arpu.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
      ...getTrend(summary.arpu, summary.arpuPrev),
      info: metricInfo.arpu
    },
    summary.arppu !== undefined && {
      title: "ARPPU",
      value: summary.arppu != null ? `$${summary.arppu.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
      ...getTrend(summary.arppu, summary.arppuPrev),
      info: metricInfo.arppu
    },
    summary.conversionRate !== undefined && {
      title: "Conversion Rate",
      value: summary.conversionRate != null ? `${summary.conversionRate.toFixed(2)}%` : '—',
      ...getTrend(summary.conversionRate, summary.conversionRatePrev),
      info: metricInfo.conversionRate
    }
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold" style={{ color: '#222' }}>Overview</h1>
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mt-4 items-center">
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
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.filter(Boolean).map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* DAU & Revenue Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Daily Active Users</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.summary.dauTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: tr })} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(label) => `Date: ${format(new Date(label), 'dd MMM yyyy', { locale: tr })}`} />
                <Line type="monotone" dataKey="dau" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.summary.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: tr })} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Revenue']} labelFormatter={(label) => `Date: ${format(new Date(label), 'dd MMM yyyy', { locale: tr })}`} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Churn Rate Chart */}
      {data.summary.churnRate && data.summary.churnRate.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Churn Rate</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.summary.churnRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: tr })}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Churn Rate']}
                  labelFormatter={(label) => `Date: ${format(new Date(label), 'dd MMM yyyy', { locale: tr })}`}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trend & Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trends?.revenue?.length > 0 && <RevenueChart data={trends.revenue} titleColor="#222" />}
        {trends?.retention?.length > 0 && <RetentionChart data={trends.retention} titleColor="#222" />}
        {trends?.revenueByProduct?.length > 0 && <RevenueByProductChart data={trends.revenueByProduct} titleColor="#222" />}
        {trends?.revenueByPlatform?.length > 0 && <RevenueByPlatformChart data={trends.revenueByPlatform} titleColor="#222" />}
        {trends?.sessionByHour?.length > 0 && <SessionByHourChart data={trends.sessionByHour} titleColor="#222" />}
        {trends?.topEvents?.length > 0 && <TopEventsChart data={trends.topEvents} titleColor="#222" />}
      </div>
    </div>
  );
} 