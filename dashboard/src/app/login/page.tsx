"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log('LOGIN: API request started');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://aeonanalytic.com/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log('LOGIN: API response received', response);
      const data = await response.json();
      console.log('LOGIN: API response JSON', data);
      if (data.success && data.token) {
        console.log('LOGIN TOKEN:', data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.developer));
        window.dispatchEvent(new Event("userChanged"));
        router.push('/dashboard');
      } else {
        setError(data.message || "Login failed");
        console.log('LOGIN: Failed response', data);
      }
    } catch (err) {
      setError("Server error");
      console.log('LOGIN: Error occurred', err);
    }
    setLoading(false);
  };

  console.log('LOGIN PAGE RENDERED');

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          {error && <div className="mb-4 bg-red-900/30 border-l-4 border-red-500 p-3 rounded text-red-400 text-sm">{error}</div>}
          <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Sign In
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Don't have an account? </span>
            <Link href="/signup" className="text-blue-400 hover:underline ml-1">Create an account</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
