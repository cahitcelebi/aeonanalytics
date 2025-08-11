"use client";
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "next/navigation";
import { Autocomplete, TextField, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { DashboardContext } from "../layout";
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface LevelMetric {
  levelNumber: number;
  completionRate: number;
  completionRatePrev?: number;
  avgScore: number;
  avgStars: number;
  avgAttempts: number;
  avgCompletionTime: number;
  failRate: number;
}
interface FunnelStep {
  step: string;
  users: number;
}
interface ProgressionData {
  levels: LevelMetric[];
  funnel: FunnelStep[];
}

export default function ProgressionPage() {
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProgressionData>({ levels: [], funnel: [] });
  const [country, setCountry] = useState('');
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('');
  const [device, setDevice] = useState('');
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [filterOptions, setFilterOptions] = useState({ countries: [], versions: [], platforms: [], devices: [] });
  const [minLevel, setMinLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(10);

  const dashboardCtx = useContext(DashboardContext);
  const startDate = dashboardCtx?.dateRange.start.toISOString().slice(0, 10);
  const endDate = dashboardCtx?.dateRange.end.toISOString().slice(0, 10);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!gameId) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/metrics/filters/${gameId}`);
      if (res.ok) {
        const opts = await res.json();
        setFilterOptions(opts);
      }
    };
    fetchFilterOptions();
  }, [gameId]);

  useEffect(() => {
    const fetchProgression = async () => {
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
        const res = await fetch(`${apiUrl}/api/metrics/progression/${gameId}?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("API error");
        const d = await res.json();
        setData(d);
      } catch (e) {
        setError("Veriler alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    if (gameId && startDate && endDate) fetchProgression();
  }, [gameId, startDate, endDate, country, version, platform, playerId, device]);

  const getTrend = (current: number, previous: number): { change: string; trend: "up" | "down" } => {
    const change = current - previous;
    const trend = change > 0 ? "up" : change < 0 ? "down" : "up";
    return { change: `${change.toFixed(1)}%`, trend };
  };

  const handlePlayerIdInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerIdInput(event.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Increased debounce to 300ms for smoother UX
    debounceRef.current = setTimeout(() => {
      setPlayerId(event.target.value);
    }, 300);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  const hasData = data.levels && data.levels.length > 0;
  const levelsToShow = hasData ? data.levels : [{
    levelNumber: 1,
    completionRate: 0,
    completionRatePrev: 0,
    avgScore: 0,
    avgStars: 0,
    avgAttempts: 0,
    avgCompletionTime: 0,
    failRate: 0
  }];
  const funnelToShow = data.funnel && data.funnel.length > 0 ? data.funnel : [
    { step: 'Level 1 Started', users: 0 },
    { step: 'Level 1 Completed', users: 0 },
    { step: 'Level 1 Failed', users: 0 }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Progression</h1>
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
      {/* Funnel Level Range Filter (now below filters) */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-gray-700">Funnel Level Range:</span>
        <TextField
          type="number"
          size="small"
          label="Min"
          value={minLevel}
          onChange={e => setMinLevel(Number(e.target.value))}
          inputProps={{ min: 1, max: 100 }}
          sx={{ width: 80 }}
        />
        <span>-</span>
        <TextField
          type="number"
          size="small"
          label="Max"
          value={maxLevel}
          onChange={e => setMaxLevel(Number(e.target.value))}
          inputProps={{ min: minLevel, max: 100 }}
          sx={{ width: 80 }}
        />
      </div>
      {/* Metric Cards for each level in range */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="font-medium text-gray-700">Completion Rate Metrics</div>
        </AccordionSummary>
        <AccordionDetails>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {levelsToShow
              .filter(l => l.levelNumber >= minLevel && l.levelNumber <= maxLevel)
              .map((metric: LevelMetric, index: number) => (
                <MetricCard
                  key={index}
                  title={`Level ${metric.levelNumber} Completion Rate`}
                  value={`${isNaN(metric.completionRate) ? 0 : metric.completionRate.toFixed(1)}%`}
                  change={(() => {
                    const prev = isNaN(metric.completionRatePrev ?? 0) ? 0 : (metric.completionRatePrev ?? 0);
                    const curr = isNaN(metric.completionRate) ? 0 : metric.completionRate;
                    if (prev === 0 && curr === 0) return "0%";
                    if (prev === 0 && curr > 0) return "+100%";
                    if (prev === 0) return "0%";
                    const diff = curr - prev;
                    const percent = ((diff / prev) * 100).toFixed(1);
                    return (diff >= 0 ? "+" : "") + percent + "%";
                  })()}
                  trend={(() => {
                    const prev = isNaN(metric.completionRatePrev ?? 0) ? 0 : (metric.completionRatePrev ?? 0);
                    const curr = isNaN(metric.completionRate) ? 0 : metric.completionRate;
                    if (curr > prev) return "up";
                    if (curr < prev) return "down";
                    return undefined;
                  })()}
                />
              ))}
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Additional metrics as cards for each level in range */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="font-medium text-gray-700">Additional Metrics</div>
        </AccordionSummary>
        <AccordionDetails>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {levelsToShow
              .filter(l => l.levelNumber >= minLevel && l.levelNumber <= maxLevel)
              .map((metric: LevelMetric, index: number) => (
                <React.Fragment key={index}>
                  <MetricCard
                    title={`Level ${metric.levelNumber} Fail Rate`}
                    value={`${isNaN(metric.failRate) ? 0 : metric.failRate.toFixed(1)}%`}
                  />
                  <MetricCard
                    title={`Level ${metric.levelNumber} Avg. Score`}
                    value={`${isNaN(metric.avgScore) ? 0 : metric.avgScore.toFixed(1)}`}
                  />
                  <MetricCard
                    title={`Level ${metric.levelNumber} Avg. Attempts`}
                    value={`${isNaN(metric.avgAttempts) ? 0 : metric.avgAttempts.toFixed(2)}`}
                  />
                  <MetricCard
                    title={`Level ${metric.levelNumber} Avg. Completion Time`}
                    value={`${isNaN(metric.avgCompletionTime) ? 0 : Math.round(metric.avgCompletionTime)}s`}
                  />
                </React.Fragment>
              ))}
          </div>
        </AccordionDetails>
      </Accordion>

      {/* Breakdown Table: update text color for readability */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 font-medium text-gray-700">Breakdown</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-gray-900">Step</th>
              <th className="px-2 py-1 text-left text-gray-900">Step completion</th>
              <th className="px-2 py-1 text-left text-gray-900">Churn</th>
              <th className="px-2 py-1 text-left text-gray-900">Total completion</th>
            </tr>
          </thead>
          <tbody>
            {levelsToShow
              .filter(l => l.levelNumber >= minLevel && l.levelNumber <= maxLevel)
              .map((level, idx, arr) => {
                const totalCompletion = arr.slice(0, idx + 1).reduce((acc, l) => acc * (l.completionRate / 100), 1) * 100;
                return (
                  <tr key={level.levelNumber}>
                    <td className="px-2 py-1 text-gray-800">Level {level.levelNumber}</td>
                    <td className="px-2 py-1 text-gray-800">{isNaN(level.completionRate) ? '0.00%' : `${level.completionRate.toFixed(2)}%`}</td>
                    <td className="px-2 py-1 text-gray-800">{isNaN(level.failRate) ? '0.00%' : `${level.failRate.toFixed(2)}%`}</td>
                    <td className="px-2 py-1 text-gray-800">
                      <div className="flex items-center">
                        <span>{isNaN(totalCompletion) ? '0.00%' : `${totalCompletion.toFixed(2)}%`}</span>
                        <div className="ml-2 h-4 bg-blue-300 rounded" style={{ width: `${totalCompletion}%`, minWidth: 10, maxWidth: 120 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Progression Funnel Table: update text color for readability */}
      {funnelToShow && funnelToShow.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-4 font-medium text-gray-700">Progression Funnel</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-gray-900">Step</th>
                <th className="px-2 py-1 text-left text-gray-900">Users</th>
              </tr>
            </thead>
            <tbody>
              {funnelToShow
                .filter(step => {
                  const levelMatch = step.step.match(/Level (\d+)/);
                  if (!levelMatch) return false;
                  const level = parseInt(levelMatch[1], 10);
                  return level >= minLevel && level <= maxLevel;
                })
                .map((step: FunnelStep, idx: number) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 text-gray-800">{step.step}</td>
                    <td className="px-2 py-1 text-gray-800">{step.users}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Progression Over Time Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 font-medium text-gray-700">Progression Over Time</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={levelsToShow.filter(l => l.levelNumber >= minLevel && l.levelNumber <= maxLevel)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="levelNumber"
                label={{ value: 'Level', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => [`${isNaN(value) ? 0 : value.toFixed(1)}%`, 'Completion Rate']}
                labelFormatter={(label) => `Level ${label}`}
              />
              <Line
                type="monotone"
                dataKey="completionRate"
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