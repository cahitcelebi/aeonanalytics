import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const DateRangeFilter: React.FC = () => {
  const { dateRange, setDateRange } = useAnalytics();
  const today = endOfDay(new Date());
  const minDate = startOfDay(subDays(today, 365)); // Son 1 yıl
  const maxDate = today;

  // Component mount olduğunda default tarih aralığını ayarla
  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setDateRange({
        startDate: startOfDay(subDays(today, 7)), // Son 7 gün
        endDate: today
      });
    }
  }, []);

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({ 
        ...dateRange, 
        startDate: startOfDay(date) 
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({ 
        ...dateRange, 
        endDate: endOfDay(date) 
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Date Range
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DatePicker
            label="Start Date"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            minDate={minDate}
            maxDate={dateRange.endDate || maxDate}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                size: "small"
              } 
            }}
          />
          <DatePicker
            label="End Date"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            minDate={dateRange.startDate || minDate}
            maxDate={maxDate}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                size: "small"
              } 
            }}
          />
        </Box>
      </LocalizationProvider>
    </Box>
  );
};

export default DateRangeFilter; 