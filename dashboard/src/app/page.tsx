"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
        // router.replace('/dashboard'); // Yönlendirme kaldırıldı
      } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          {user ? `Welcome back, ${user.username}!` : 'Make smarter decisions at every game stage'}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Unify game performance, player behavior and market intelligence in one platform – for faster, smarter decisions that drive growth.
        </p>
        <div className="space-x-4 mb-12">
          {!user && <Link href="/signup" className="px-6 py-3 rounded bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition">Get Started</Link>}
          {!user && <button className="px-6 py-3 rounded bg-gray-100 text-gray-700 font-semibold text-lg hover:bg-gray-200 transition">Book a Demo</button>}
          {user && <Link href="/dashboard" className="px-6 py-3 rounded bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition">Go to Dashboard</Link>}
        </div>
        {/* Metrik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12">
          <div className="bg-white p-8 rounded-2xl shadow flex flex-col items-center min-w-[280px] max-w-[340px] w-full">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Analytics</h3>
            <p className="text-gray-600 mb-5 text-center">Get an overview of your game's performance in minutes</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 w-full">
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">90K</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">DAU</div>
              </div>
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">2.25M</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">MAU</div>
              </div>
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">12m 20s</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Playtime</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow flex flex-col items-center min-w-[280px] max-w-[340px] w-full">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Ad & Market Intelligence</h3>
            <p className="text-gray-600 mb-5 text-center">Understand the playing field with comprehensive market insights</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 w-full">
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">96K</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Ad Creatives</div>
              </div>
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">24K</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">App Downloads</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow flex flex-col items-center min-w-[280px] max-w-[340px] w-full">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Data Management</h3>
            <p className="text-gray-600 mb-5 text-center">Perform advanced analyses with an out-of-the-box data pipeline</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 w-full">
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">GA</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Data Pipeline</div>
              </div>
              <div className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-600">AWS</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Cloud</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 