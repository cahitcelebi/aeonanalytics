'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { DashboardContext } from './layout';
import axios from 'axios';

// Renk paleti
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface MetricCardProps {
  title: string;
  value: number | string;
  change: string;
  trend: 'up' | 'down';
}

function MetricCard({ title, value, change, trend }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <span className={`ml-2 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

export default function GameDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) return <div className="text-red-500">Dashboard context not found!</div>;
  const { dateRange, datePreset, setDatePreset, mode, DATE_PRESETS } = ctx;
  console.log('dateRange in dashboard:', dateRange);
  if (!dateRange || !dateRange.start || !dateRange.end) {
    return <div className="text-red-500">Date range is not set!</div>;
  }
  const { gameId } = useParams();
  const [metrics, setMetrics] = useState({
    dau: 0,
    wau: 0,
    mau: 0,
    avgSessionDuration: 0,
    retention: {
      day1: 0,
      day7: 0,
      day30: 0
    }
  });
  const [gameInfo, setGameInfo] = useState<{ name: string; platform?: string } | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const [activityChartData, setActivityChartData] = useState<any[]>([]);
  const [retentionCohorts, setRetentionCohorts] = useState<any[]>([]);
  const [eventChartData, setEventChartData] = useState<any[]>([]);
  const [sessionChartData, setSessionChartData] = useState<any[]>([]);
  const [newUserChartData, setNewUserChartData] = useState<any[]>([]);

  // DATE_PRESETS undefined ise fallback olarak local bir dizi kullan
  const fallbackDatePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'Last 15 Days', value: 'last15' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Custom', value: 'custom' },
  ];
  const presets = DATE_PRESETS ?? fallbackDatePresets;

  useEffect(() => {
    fetchGameInfo();
  }, [gameId]);

  const fetchGameInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 404) {
        setGameInfo(null);
        setGameError('Game not found');
        return;
      }
      if (!response.ok) {
        setGameInfo(null);
        setGameError('An error occurred while fetching game info.');
        return;
      }
      const data = await response.json();
      if (data.game) {
        setGameInfo({ name: data.game.name, platform: data.game.platform });
        setGameError(null);
      } else {
        setGameInfo(null);
        setGameError('Game not found');
      }
    } catch (error) {
      setGameInfo(null);
      setGameError('An error occurred while fetching game info.');
    }
  };

  useEffect(() => {
    const now = new Date();
    let start: Date = now;
    let end: Date = now;
    switch (datePreset) {
      case 'today':
        start = end = now;
        break;
      case 'yesterday':
        start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'last7':
        start = subDays(now, 6);
        end = now;
        break;
      case 'last15':
        start = subDays(now, 14);
        end = now;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        end = now;
        break;
      case 'custom':
        return; // Custom'da elle değiştirilecek
    }
  }, [datePreset]);

  useEffect(() => {
    setFetching(true);
    fetchMetrics().finally(() => setFetching(false));
  }, [gameId, dateRange, mode]);

  const fetchMetrics = async () => {
    if (!dateRange || !dateRange.start || !dateRange.end) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');
      
      const response = await fetch(
        `${apiUrl}/api/games/${gameId}/metrics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log('Metrics API response:', data);
      setMetrics(data);
      if (data.activityChart) setActivityChartData(data.activityChart);
      if (data.eventChart) setEventChartData(data.eventChart);
      if (data.sessionChart) {
        console.log('Setting session chart data:', data.sessionChart);
        setSessionChartData(data.sessionChart);
      }
      if (data.newUserChart) setNewUserChartData(data.newUserChart);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  // Retention verisini doğrudan /api/retention'dan çek
  useEffect(() => {
    if (!gameId || !dateRange?.start || !dateRange?.end) return;
    const fetchRetention = async () => {
      try {
        const start = format(dateRange.start, 'yyyy-MM-dd');
        const end = format(dateRange.end, 'yyyy-MM-dd');
        const response = await axios.get(`/api/retention?gameId=${gameId}&dateRange=${start},${end}`);
        if (response.data && response.data.cohorts) {
          setRetentionCohorts(response.data.cohorts);
        }
      } catch (err) {
        setRetentionCohorts([]);
      }
    };
    fetchRetention();
  }, [gameId, dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Başlık ve filtre barı */}
      <div className="flex items-center justify-between mb-8">
        {/* <h1 className="text-2xl font-bold text-blue-800">Metrics</h1> */}
      </div>
      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Daily Active Users"
          value={metrics.dau}
          change="+12%"
          trend="up"
        />
        <MetricCard
          title="Weekly Active Users"
          value={metrics.wau}
          change="+8%"
          trend="up"
        />
        <MetricCard
          title="Monthly Active Users"
          value={metrics.mau}
          change="+5%"
          trend="up"
        />
        <MetricCard
          title="Avg. Session Duration"
          value={isNaN(metrics.avgSessionDuration) ? '-' : `${Math.round(metrics.avgSessionDuration / 60)}m`}
          change="+2%"
          trend="up"
        />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">User Activity</h2>
          <div className="h-80 flex items-center justify-center">
            {fetching ? (
              <span className="text-gray-400">Loading...</span>
            ) : activityChartData.length === 0 ? (
              <span className="text-gray-400">No data for selected range</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Event Analysis</h2>
          <div className="h-80 flex items-center justify-center">
            {fetching ? (
              <span className="text-gray-400">Loading...</span>
            ) : eventChartData.length === 0 ? (
              <span className="text-gray-400">No data for selected range</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Session Analysis</h2>
          <div className="h-80 flex items-center justify-center">
            {fetching ? (
              <span className="text-gray-400">Loading...</span>
            ) : sessionChartData.length === 0 ? (
              <span className="text-gray-400">No data for selected range</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">New User Analysis</h2>
          <div className="h-80 flex items-center justify-center">
            {fetching ? (
              <span className="text-gray-400">Loading...</span>
            ) : newUserChartData.length === 0 ? (
              <span className="text-gray-400">No data for selected range</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={newUserChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="newUsers" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Retention</h2>
          <div className="overflow-x-auto">
            {(() => {
              // Day kolonları
              const dayCols = [1,2,3,4,5,6,7,15,30];
              // Seçili tarih aralığındaki her günü oluştur
              const days = [];
              let d = new Date(dateRange.start);
              const end = new Date(dateRange.end);
              while (d <= end) {
                days.push(format(d, 'yyyy-MM-dd'));
                d.setDate(d.getDate() + 1);
              }
              // retentionCohorts'tan gün bazlı objeler
              const dataByDate = Object.fromEntries(retentionCohorts.map(row => [row.date, row]));
              return (
                <table className="min-w-full text-center border rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 text-gray-700 font-semibold">Date</th>
                      {dayCols.map(day => (
                        <th key={day} className="px-3 py-2 bg-gray-100 text-gray-700 font-semibold">Day {day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(date => {
                      const row = dataByDate[date] || {};
                      const todayStr = format(new Date(), 'yyyy-MM-dd');
                      if (date >= todayStr) {
                        return (
                          <tr key={date} className="hover:bg-blue-50">
                            <td className="px-3 py-2 text-gray-600 font-medium">{date}</td>
                            {dayCols.map(day => (
                              <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                            ))}
                          </tr>
                        );
                      }
                      return (
                        <tr key={date} className="hover:bg-blue-50">
                          <td className="px-3 py-2 text-gray-600 font-medium">{date}</td>
                          {dayCols.map(day => {
                            const val = row[`day${day}`] ?? 0;
                            // Hücrenin temsil ettiği tarihi bul
                            const cohortDate = new Date(row.date);
                            const cellDate = new Date(cohortDate);
                            cellDate.setDate(cohortDate.getDate() + day);
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            // Eğer bugünden ileri bir günse '-'
                            if (cellDate > today) {
                              return (
                                <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                              );
                            }
                            // Değer 0 ise '0%', >0 ise '%'
                            return (
                              <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {val === 0 ? '0%' : `${val}%`}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 