import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalytics';

const PlatformFilter: React.FC = () => {
  const { selectedPlatform, setSelectedPlatform } = useAnalytics();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Platform
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Platform</InputLabel>
        <Select
          value={selectedPlatform}
          label="Platform"
          onChange={(e) => setSelectedPlatform(e.target.value)}
        >
          <MenuItem value="all">All Platforms</MenuItem>
          <MenuItem value="ios">iOS</MenuItem>
          <MenuItem value="android">Android</MenuItem>
          <MenuItem value="web">Web</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default PlatformFilter; 