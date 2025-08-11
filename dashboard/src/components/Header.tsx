"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  email: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgisi localStorage'dan alınır (login sonrası kaydedilmiş olmalı)
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    } else {
      setUser(null);
    }
    // localStorage değişimini dinle
    function handleStorage(e: StorageEvent) {
      if (e.key === "user") {
        if (e.newValue) setUser(JSON.parse(e.newValue));
        else setUser(null);
      }
    }
    window.addEventListener("storage", handleStorage);
    // Custom event dinle
    function handleUserChanged() {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (userStr) setUser(JSON.parse(userStr));
      else setUser(null);
    }
    window.addEventListener("userChanged", handleUserChanged);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("userChanged", handleUserChanged);
    };
  }, []);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="flex justify-between items-center px-8 py-5 bg-white shadow-sm sticky top-0 z-50">
      <Link href="/" onClick={e => { e.preventDefault(); router.push('/'); }} className="text-2xl font-extrabold text-blue-700 tracking-tight hover:text-blue-900 transition cursor-pointer select-none">
        Aeon Analytics
      </Link>
      <div className="space-x-4 flex items-center">
        {!user ? (
          <>
            <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Login</Link>
            <Link href="/signup" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition">Sign Up</Link>
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <span className="mr-2">{user.username}</span>
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-[9999] animate-fade-in" style={{ pointerEvents: 'auto' }}>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition" onClick={() => setDropdownOpen(false)}>My Games</Link>
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition" onClick={() => setDropdownOpen(false)}>Profile</Link>
                <button onClick={() => { setDropdownOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 