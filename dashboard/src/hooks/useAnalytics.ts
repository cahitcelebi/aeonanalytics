import { useState, useEffect } from 'react';
import axios from 'axios';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface Event {
  name: string;
  type: string;
  platform: string;
  count: number;
  lastOccurrence: string;
}

interface AnalyticsData {
  dau: number;
  wau: number;
  mau: number;
  revenue: number;
  dauChange: number;
  wauChange: number;
  mauChange: number;
  revenueChange: number;
}

export const useAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Son 7 gün
    endDate: new Date(),
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [events, setEvents] = useState<Event[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dau: 0,
    wau: 0,
    mau: 0,
    revenue: 0,
    dauChange: 0,
    wauChange: 0,
    mauChange: 0,
    revenueChange: 0,
  });
  const [dauData, setDauData] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedPlatform]);

  const fetchData = async () => {
    try {
      const params = {
        startDate: dateRange.startDate?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: dateRange.endDate?.toISOString() || new Date().toISOString(),
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
      };

      const [analyticsResponse, eventsResponse, dauResponse, retentionResponse, revenueResponse] =
        await Promise.all([
          axios.get('/api/analytics/metrics', { params }),
          axios.get('/api/analytics/events', { params }),
          axios.get('/api/analytics/dau', { params }),
          axios.get('/api/analytics/retention', { params }),
          axios.get('/api/analytics/revenue', { params }),
        ]);

      setAnalyticsData(analyticsResponse.data);
      setEvents(eventsResponse.data);
      setDauData(dauResponse.data);
      setRetentionData(retentionResponse.data);
      setRevenueData(revenueResponse.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportData = async () => {
    try {
      const params = {
        startDate: dateRange.startDate?.toISOString(),
        endDate: dateRange.endDate?.toISOString(),
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
      };

      const response = await axios.get('/analytics/export', { params });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  return {
    dateRange,
    setDateRange,
    selectedPlatform,
    setSelectedPlatform,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    events,
    analyticsData,
    dauData,
    retentionData,
    revenueData,
    exportData,
  };
}; 
