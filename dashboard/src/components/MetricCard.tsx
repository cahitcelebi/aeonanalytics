import React from "react";
export function MetricCard({ title, value, prefix }: { title: string; value: number; prefix?: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
      <div className="text-gray-500 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{prefix}{value}</div>
    </div>
  );
} 