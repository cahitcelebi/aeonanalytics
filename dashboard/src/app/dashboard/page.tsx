"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Game {
  id: number;
  name: string;
  apiKey: string;
  description?: string;
  platform?: string;
}

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const platformOptions = [
    "iOS", "Android", "PC", "Mac", "PlayStation", "Xbox", "Switch", "Web", "VR", "Other"
  ];
  const [newGamePlatform, setNewGamePlatform] = useState(platformOptions[0]);
  const [newGameDescription, setNewGameDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copyId, setCopyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPlatform, setCustomPlatform] = useState("");
  const router = useRouter();

  const platformIcons: Record<string, JSX.Element> = {
    'iOS': <span title="iOS" className="ml-2">🍏</span>,
    'Android': <span title="Android" className="ml-2">🤖</span>,
    'PC': <span title="PC" className="ml-2">💻</span>,
    'Mac': <span title="Mac" className="ml-2">🍎</span>,
    'PlayStation': <span title="PlayStation" className="ml-2">🎮</span>,
    'Xbox': <span title="Xbox" className="ml-2">🕹️</span>,
    'Switch': <span title="Switch" className="ml-2">🎲</span>,
    'Web': <span title="Web" className="ml-2">🌐</span>,
    'VR': <span title="VR" className="ml-2">🕶️</span>,
    'Other': <span title="Other" className="ml-2">🔗</span>
  };

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/games`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setGames(data.games);
        else setError(data.message || "Failed to fetch games.");
      } catch (err) {
        setError("Failed to fetch games.");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  // Add game
  useEffect(() => {
    if (showAddModal) {
      setNewGamePlatform(platformOptions[0]);
      setCustomPlatform("");
    }
  }, [showAddModal]);

  const handleAddGame = async () => {
    if (!newGameName.trim() || !newGamePlatform || (newGamePlatform === 'Other' && !customPlatform.trim())) {
      setError('Please fill in all required fields, including platform.');
      return;
    }
    setAddLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const platformToSend = newGamePlatform === 'Other' ? customPlatform : newGamePlatform;
      console.log('Adding game with platform:', platformToSend);
      const res = await fetch(`${apiUrl}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGameName, platform: platformToSend, description: newGameDescription })
      });
      const data = await res.json();
      if (data.success) {
        setGames((prev) => [...prev, data.game]);
        setShowAddModal(false);
        setNewGameName("");
        setNewGamePlatform(platformOptions[0]);
        setNewGameDescription("");
        setCustomPlatform("");
      } else {
        setError(data.message || "Failed to add game.");
      }
    } catch {
      setError("Failed to add game.");
    } finally {
      setAddLoading(false);
    }
  };

  // Edit game name
  const handleEditGame = async () => {
    if (!editName.trim() || editId === null) return;
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/games/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName })
      });
      const data = await res.json();
      if (data.success) {
        setGames((prev) => prev.map(g => g.id === editId ? { ...g, name: editName } : g));
        setEditId(null);
        setEditName("");
      } else {
        setError(data.message || "Failed to update game.");
      }
    } catch {
      setError("Failed to update game.");
    }
  };

  // Delete game
  const handleDeleteGame = async (id: number) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/games/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGames((prev) => prev.filter(g => g.id !== id));
        setDeleteId(null);
      } else {
        setError(data.message || "Failed to delete game.");
      }
    } catch {
      setError("Failed to delete game.");
    }
  };

  // Copy API Key
  const handleCopy = (apiKey: string, id: number) => {
    navigator.clipboard.writeText(apiKey);
    setCopyId(id);
    setTimeout(() => setCopyId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" onClick={e => { e.preventDefault(); router.push('/'); }} className="text-2xl font-bold text-blue-700">Your Games</Link>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Add Game</button>
      </div>
      {error && <div className="mb-4 bg-red-100 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm">{error}</div>}
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 text-lg">You have no games yet. Start by adding one!</div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-start relative border border-gray-100 min-w-[320px] max-w-[420px] w-full mx-auto text-gray-900 transition-all">
                <div className="flex items-center w-full mb-3">
                  <span className="font-semibold text-2xl flex-1 truncate text-gray-900 flex items-center" title={game.name}>
                    {game.name}
                  </span>
                  <button onClick={() => { setEditId(game.id); setEditName(game.name); }} className="ml-3 text-blue-600 hover:text-blue-800 text-xl" title="Edit Game Name">✏️</button>
                  <button onClick={() => { setDeleteId(game.id); }} className="ml-2 text-red-500 hover:text-red-700 text-xl" title="Delete Game">🗑️</button>
                </div>
                {game.platform && (
                  <div className="mb-2 text-sm text-gray-500 font-medium">
                    Platform: <span className="text-gray-900 font-semibold">{game.platform}</span>
                  </div>
                )}
                {game.description && <div className="mb-4 text-sm text-gray-500 font-medium">{game.description}</div>}
                <div className="flex items-center mb-5 w-full">
                  <span className="text-xs text-gray-500 mr-2">API Key:</span>
                  <span className="font-mono text-base bg-gray-100 px-3 py-1 rounded select-all truncate text-gray-900 font-semibold" title={game.apiKey}>{game.apiKey}</span>
                  <button onClick={() => handleCopy(game.apiKey, game.id)} className="ml-2 text-gray-400 hover:text-blue-600 text-lg" title="Copy API Key">{copyId === game.id ? '✔️' : '📋'}</button>
                </div>
                <div className="flex space-x-2 w-full">
                  <Link href={`/dashboard/${game.id}/overview`} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-base text-center hover:bg-blue-700 transition">View Dashboard</Link>
                </div>
                {/* Edit Modal */}
                {editId === game.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                      <h2 className="text-2xl font-extrabold text-center mb-6 text-gray-900">Edit Game Name</h2>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="block w-full border border-gray-300 px-4 py-3 rounded-md mb-6 text-gray-900 text-lg font-medium bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => setEditId(null)} className="px-5 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={handleEditGame} className="px-5 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md">Save</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Delete Modal */}
                {deleteId === game.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                      <h2 className="text-2xl font-extrabold text-center mb-4 text-red-600">Delete Game</h2>
                      <p className="text-gray-700 text-center mb-6">Are you sure you want to delete <span className="font-semibold text-red-500">{game.name}</span>?</p>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={() => handleDeleteGame(game.id)} className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-md">Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {/* Add Game Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
            <h2 className="text-2xl font-extrabold text-center mb-4 text-gray-900">Add New Game</h2>
            <input value={newGameName} onChange={e => setNewGameName(e.target.value)} placeholder="Game Name" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-3 transition-all" autoFocus required />
            <select value={newGamePlatform} onChange={e => setNewGamePlatform(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm text-gray-900 text-base mb-3 transition-all" required>
              {platformOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {newGamePlatform === "Other" && (
              <input value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} placeholder="Enter platform" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-3 transition-all" />
            )}
            <textarea value={newGameDescription} onChange={e => setNewGameDescription(e.target.value)} placeholder="Description" className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base mb-4 resize-none transition-all" rows={3} />
            <div className="flex justify-end space-x-2 mt-2">
              <button onClick={() => { setShowAddModal(false); setNewGameName(""); setNewGamePlatform(""); setNewGameDescription(""); setCustomPlatform(""); }} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleAddGame} disabled={addLoading} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md">{addLoading ? 'Adding...' : 'Add Game'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 