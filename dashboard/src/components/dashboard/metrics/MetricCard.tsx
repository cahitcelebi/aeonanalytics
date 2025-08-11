import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  prevValue?: string;
}

const MetricCardWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TrendIcon = styled(Box)<{ trend: 'up' | 'down' | 'neutral' }>(({ theme, trend }) => ({
  display: 'flex',
  alignItems: 'center',
  color:
    trend === 'up'
      ? theme.palette.success.main
      : trend === 'down'
      ? theme.palette.error.main
      : theme.palette.text.disabled,
}));

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change = '', trend, prevValue }) => {
  let trendType: 'up' | 'down' | 'neutral' = 'neutral';
  if (trend === 'up' && change && change !== '0%' && change !== '+0.0%') trendType = 'up';
  else if (trend === 'down' && change && change !== '0%' && change !== '+0.0%') trendType = 'down';
  else trendType = 'neutral';

  return (
    <MetricCardWrapper elevation={2}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      {prevValue && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>
          Prev: {prevValue}
        </Typography>
      )}
      <TrendIcon trend={trendType} sx={{ mt: 1 }}>
        {trendType === 'up' && <TrendingUpIcon fontSize="small" />}
        {trendType === 'down' && <TrendingDownIcon fontSize="small" />}
        <Typography
          variant="body2"
          color={
            trendType === 'up'
              ? 'success.main'
              : trendType === 'down'
              ? 'error.main'
              : 'text.disabled'
          }
          sx={{ ml: 0.5 }}
        >
          {change && change !== '0%' && change !== '+0.0%' ? change : '0%'}
        </Typography>
      </TrendIcon>
    </MetricCardWrapper>
  );
};

export default MetricCard; 