import React from 'react';
import { Box, Container, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import DateRangeFilter from './filters/DateRangeFilter';
import PlatformFilter from './filters/PlatformFilter';
import MetricCard from './metrics/MetricCard';
import RetentionChart from './charts/RetentionChart';
import DAUChart from './charts/DAUChart';
import RevenueChart from './charts/RevenueChart';
import EventTable from './tables/EventTable';
import ExportButton from './ExportButton';

const DashboardPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const DashboardLayout: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Filtreler */}
        <DashboardPaper>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DateRangeFilter />
            </Grid>
            <Grid item xs={12} md={6}>
              <PlatformFilter />
            </Grid>
          </Grid>
        </DashboardPaper>

        {/* Metrikler */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="DAU"
              value="12,345"
              change="+15%"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="WAU"
              value="45,678"
              change="+8%"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="MAU"
              value="123,456"
              change="+12%"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Revenue"
              value="$45,678"
              change="+20%"
              trend="up"
            />
          </Grid>
        </Grid>

        {/* Grafikler */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <DashboardPaper>
              <DAUChart />
            </DashboardPaper>
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardPaper>
              <RetentionChart />
            </DashboardPaper>
          </Grid>
          <Grid item xs={12}>
            <DashboardPaper>
              <RevenueChart />
            </DashboardPaper>
          </Grid>
        </Grid>

        {/* Tablo ve Export */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <ExportButton />
        </Box>
        <DashboardPaper>
          <EventTable />
        </DashboardPaper>
      </Box>
    </Container>
  );
};

export default DashboardLayout; 