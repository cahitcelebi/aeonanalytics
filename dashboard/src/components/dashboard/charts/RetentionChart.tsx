import React, { useState } from 'react';
import { Box, Typography, ButtonGroup, Button } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RetentionChartProps {
  data: { cohort: string; day1: number; day7: number; day30: number }[];
  titleColor?: string;
}

const seriesOptions = [
  { key: 'day1', label: 'Day 1', color: '#82ca9d' },
  { key: 'day7', label: 'Day 7', color: '#8884d8' },
  { key: 'day30', label: 'Day 30', color: '#ffc658' },
];

const RetentionChart: React.FC<RetentionChartProps> = ({ data, titleColor = '#222' }) => {
  const [activeSeries, setActiveSeries] = useState<'day1' | 'day7' | 'day30'>('day1');

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: titleColor, fontWeight: 700 }}>
        User Retention
      </Typography>
      <ButtonGroup sx={{ mb: 2 }}>
        {seriesOptions.map((s) => (
          <Button
            key={s.key}
            variant={activeSeries === s.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveSeries(s.key as any)}
            sx={{
              bgcolor: activeSeries === s.key ? s.color : undefined,
              color: activeSeries === s.key ? '#fff' : '#333',
              borderColor: s.color,
              '&:hover': { bgcolor: s.color, color: '#fff' },
            }}
          >
            {s.label}
          </Button>
        ))}
      </ButtonGroup>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey={activeSeries}
              fill={seriesOptions.find((s) => s.key === activeSeries)?.color || '#8884d8'}
              name={seriesOptions.find((s) => s.key === activeSeries)?.label}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RetentionChart; 