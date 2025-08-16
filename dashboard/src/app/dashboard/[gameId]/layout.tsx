"use client";
import React, { useState, useEffect, createContext } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { subDays } from 'date-fns';
import GameDashboard from './page';
import AeonChatBot from '../../../components/AeonChatBot';

const menuItems = [
  { path: "overview", label: "Overview" },
  { path: "realtime", label: "Realtime" },
  { path: "engagement", label: "Engagement" },
  { path: "progression", label: "Progression" },
  { path: "monetization", label: "Monetization" },
  { path: "user-analysis", label: "User Analysis" },
  { path: "performance", label: "Performance" },
  { path: "events", label: "Events" },
];

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 15 Days', value: 'last15' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom', value: 'custom' },
];

export const DashboardContext = createContext<{
  dateRange: { start: Date; end: Date };
  datePreset: string;
  setDatePreset: (v: string) => void;
  DATE_PRESETS: { label: string; value: string }[];
} | undefined>(undefined);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gameId } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [gameInfo, setGameInfo] = useState<{ name: string; platform?: string } | null>(null);
  const isRealtimePage = pathname?.includes('realtime');

  const getInitialRange = (preset: string) => {
    const now = new Date();
    let start = now, end = now;
    switch (preset) {
      case 'today': start = end = now; break;
      case 'yesterday': start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); break;
      case 'last7': start = subDays(now, 6); end = now; break;
      case 'last15': start = subDays(now, 14); end = now; break;
      case 'lastMonth': start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); end = now; break;
      default: start = subDays(now, 6); end = now;
    }
    return { start, end };
  };

  const [datePreset, setDatePreset] = useState('last7');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(getInitialRange('last7'));

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.location.href = '/login';
      return;
    }
    // Oyun adı ve platformunu çek
    const fetchGameInfo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/games/${gameId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.game) setGameInfo({ name: data.game.name, platform: data.game.platform });
      } catch {}
    };
    if (gameId) fetchGameInfo();
  }, [gameId]);

  useEffect(() => {
    setDateRange(getInitialRange(datePreset));
  }, [datePreset]);

  const dashboardProps = {
    datePreset,
    setDatePreset,
    DATE_PRESETS,
    dateRange
  };

  return (
    <DashboardContext.Provider value={dashboardProps}>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Metrics</h2>
            </div>
            <nav className="p-4">
              {menuItems.map((item) => {
                // Overview için hem /overview hem de tam ana path aktif olmalı
                const isOverview = item.path === 'overview';
                const isActive = isOverview
                  ? pathname === `/dashboard/${gameId}` || pathname === `/dashboard/${gameId}/overview`
                  : pathname?.includes(`/${item.path}`);
                return (
                  <Link
                    key={item.path}
                    href={`/dashboard/${gameId}/${item.path}`}
                    className={`block px-4 py-2 rounded-lg transition-colors font-medium mb-1 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b sticky top-0 z-10">
              {/* Sol: Back to Games butonu */}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 font-semibold hover:underline mr-4"
              >
                &larr; Back to Games
              </button>
              {/* Ortada oyun adı ve platform */}
              <div className="flex-1 flex justify-center">
                <span className="text-xl font-semibold text-gray-800">
                  {gameInfo?.name || ''} {gameInfo?.platform ? `(${gameInfo.platform})` : ''}
                </span>
              </div>
              {/* Sağda tarih filtresi */}
              {!isRealtimePage && (
                <div className="flex gap-2 items-center bg-white rounded-lg px-2 py-1 border border-gray-200 shadow-sm ml-auto">
                  <select
                    value={datePreset}
                    onChange={e => setDatePreset(e.target.value)}
                    className="px-2 py-1 rounded bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DATE_PRESETS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {datePreset === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={dateRange ? dateRange.start.toISOString().slice(0, 10) : ''}
                        onChange={e => setDateRange(dateRange ? { ...dateRange, start: new Date(e.target.value) } : { start: new Date(e.target.value), end: new Date(e.target.value) })}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                      <input
                        type="date"
                        value={dateRange ? dateRange.end.toISOString().slice(0, 10) : ''}
                        onChange={e => setDateRange(dateRange ? { ...dateRange, end: new Date(e.target.value) } : { start: new Date(), end: new Date(e.target.value) })}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
      {/* Chatbot */}
      <AeonChatBot />
    </DashboardContext.Provider>
  );
} 