import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SessionByHourChartProps {
  data: { hour: number; value: number }[];
  titleColor?: string;
}

const SessionByHourChart: React.FC<SessionByHourChartProps> = ({ data, titleColor = "#222" }) => (
  <Box>
    <Typography variant="h6" gutterBottom sx={{ color: titleColor, fontWeight: 700 }}>
      Session Distribution by Hour
    </Typography>
    <Box sx={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#ffc658" name="Sessions" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

export default SessionByHourChart; 