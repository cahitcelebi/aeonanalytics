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

interface RevenueByProductChartProps {
  data: { product: string; value: number }[];
  titleColor?: string;
}

const RevenueByProductChart: React.FC<RevenueByProductChartProps> = ({ data, titleColor = "#222" }) => (
  <Box>
    <Typography variant="h6" gutterBottom sx={{ color: titleColor, fontWeight: 700 }}>
      Revenue by Product
    </Typography>
    <Box sx={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="product" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

export default RevenueByProductChart; 