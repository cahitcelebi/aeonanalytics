import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Typography } from '@mui/material';

const categories = [
  { key: 'overview', label: 'Overview' },
  { key: 'realtime', label: 'Realtime' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'progression', label: 'Progression' },
  { key: 'monetization', label: 'Monetization' },
  { key: 'user-analysis', label: 'User Analysis' },
  { key: 'performance', label: 'Performance' },
  { key: 'events', label: 'Events' },
];

const Sidebar: React.FC = () => {
  const params = useParams();
  const pathname = usePathname();
  const gameId = params?.gameId;
  const activeCategory = pathname?.split('/').pop();

  return (
    <nav className="bg-white border-r h-full min-h-screen w-56 flex flex-col py-6 px-2">
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Metrics
      </Typography>
      <ul className="flex-1 space-y-2">
        {categories.map(cat => (
          <li key={cat.key}>
            <Link
              href={`/dashboard/${gameId}/${cat.key}`}
              className={`block px-4 py-2 rounded-lg transition-colors font-medium ${
                activeCategory === cat.key
                  ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar; 