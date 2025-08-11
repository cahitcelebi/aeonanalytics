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

interface RevenueByPlatformChartProps {
  data: { platform: string; value: number }[];
  titleColor?: string;
}

const RevenueByPlatformChart: React.FC<RevenueByPlatformChartProps> = ({ data, titleColor = "#222" }) => (
  <Box>
    <Typography variant="h6" gutterBottom sx={{ color: titleColor, fontWeight: 700 }}>
      Revenue by Platform
    </Typography>
    <Box sx={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="platform" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#82ca9d" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

export default RevenueByPlatformChart; 