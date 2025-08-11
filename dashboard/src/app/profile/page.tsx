"use client";

import React, { useEffect, useState } from 'react';

const ProfilePage = () => {
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Varsayılan olarak localStorage'dan kullanıcıyı al
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!oldPassword || !newPassword || !newPassword2) {
      setError("Please fill in all fields."); return;
    }
    if (newPassword !== newPassword2) {
      setError("New passwords do not match."); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Password changed successfully. Please login again with your new password.");
        // Clear local storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(data.message || "Failed to change password.");
      }
    } catch {
      setError("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900">Profile</h1>
        {user ? (
          <>
            <div className="w-full mb-6">
              <div className="mb-2 text-gray-900"><span className="font-semibold">Username:</span> {user.username}</div>
              {user.email && <div className="mb-2 text-gray-900"><span className="font-semibold">Email:</span> {user.email}</div>}
            </div>
            <form onSubmit={handlePasswordChange} className="w-full">
              <h2 className="text-lg font-semibold mb-3 text-blue-700">Change Password</h2>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current Password" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-3 transition-all" />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-3 transition-all" />
              <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} placeholder="Repeat New Password" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-4 transition-all" />
              {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
              {success && <div className="mb-2 text-green-600 text-sm">{success}</div>}
              <button type="submit" disabled={loading} className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md">{loading ? 'Saving...' : 'Change Password'}</button>
            </form>
          </>
        ) : (
          <p className="text-gray-500">No user info found.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 
