"use client";
import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TextField, Autocomplete } from "@mui/material";
import { DashboardContext } from "../layout";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#d7263d", "#a2d5c6", "#077b8a", "#5c3c92"];

function formatNumber(val: number | null | undefined) {
  if (val == null || isNaN(val)) return "—";
  return val.toLocaleString();
}

export default function EventsPage() {
  const { gameId } = useParams();
  const dashboardCtx = useContext(DashboardContext);
  const startDate = dashboardCtx?.dateRange.start.toISOString().slice(0, 10);
  const endDate = dashboardCtx?.dateRange.end.toISOString().slice(0, 10);
  // Filters
  const [eventType, setEventType] = useState("");
  const [eventName, setEventName] = useState("");
  const [platform, setPlatform] = useState("");
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");
  const [version, setVersion] = useState("");
  const [playerIdInput, setPlayerIdInput] = useState("");
  const [playerId, setPlayerId] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [filterOptions, setFilterOptions] = useState<any>({ eventTypes: [], eventNames: [], platforms: [], devices: [], countries: [], versions: [], playerIds: [] });

  // Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!gameId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/metrics/events/filters/${gameId}`);
        if (!res.ok) throw new Error("Filter API error");
        const opts = await res.json();
        setFilterOptions(opts);
      } catch (e) {}
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
          startDate && `startDate=${startDate}`,
          endDate && `endDate=${endDate}`,
          eventType && `eventType=${eventType}`,
          eventName && `eventName=${eventName}`,
          platform && `platform=${platform}`,
          device && `device=${device}`,
          country && `country=${country}`,
          version && `version=${version}`,
          playerId && `playerId=${playerId}`
        ].filter(Boolean).join('&');
        const res = await fetch(
          `${apiUrl}/api/metrics/events/${gameId}?${params}`,
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
  }, [gameId, startDate, endDate, eventType, eventName, platform, device, country, version, playerId]);

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

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Events Metrics</h2>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Autocomplete
          freeSolo
          options={filterOptions.eventTypes}
          value={eventType}
          onInputChange={(_, v) => setEventType(v)}
          renderInput={(params) => <TextField {...params} label="Event Type" size="small" />}
          sx={{ minWidth: 120 }}
        />
        <Autocomplete
          freeSolo
          options={filterOptions.eventNames}
          value={eventName}
          onInputChange={(_, v) => setEventName(v)}
          renderInput={(params) => <TextField {...params} label="Event Name" size="small" />}
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
        <TextField
          label="Player ID"
          size="small"
          value={playerIdInput}
          onChange={handlePlayerIdInputChange}
          sx={{ minWidth: 120 }}
        />
      </div>
      {/* Metric Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Events" 
          value={formatNumber(data.totalEvents)}
          prevValue={formatNumber(data.totalEventsPrev)}
          change={data.totalEventsPrev && data.totalEventsPrev !== 0 ? ((data.totalEvents - data.totalEventsPrev) / data.totalEventsPrev * 100).toFixed(2) + "%" : "0%"}
          trend={data.totalEventsPrev && data.totalEvents > data.totalEventsPrev ? 'up' : data.totalEventsPrev && data.totalEvents < data.totalEventsPrev ? 'down' : undefined}
        />
      </div>
      {/* Event Type Distribution Pie/Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Event Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.typeDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="eventType" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8">
              {data.typeDistribution.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Event Trend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Event Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString()} angle={-35} textAnchor="end" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#0088FE" name="Events" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Top Events Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Top Events</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="px-2 py-1 text-left">Event Name</th>
                <th className="px-2 py-1 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.topEvents.map((row: any, i: number) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-2 py-1 text-gray-700">{row.eventName}</td>
                  <td className="px-2 py-1 text-gray-700">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Platform Breakdown */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Platform Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.platformBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#00C49F">
              {data.platformBreakdown.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Country Breakdown */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2 text-gray-700">Country Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={country ? data.countryBreakdown.filter((row: any) => row.country === country) : data.countryBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#FFBB28">
              {(country ? data.countryBreakdown.filter((row: any) => row.country === country) : data.countryBreakdown).map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 