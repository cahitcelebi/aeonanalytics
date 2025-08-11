import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import { useAnalytics } from '../../../hooks/useAnalytics';

const EventTable: React.FC = () => {
  const { events, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } = useAnalytics();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Event Name</TableCell>
            <TableCell>Event Type</TableCell>
            <TableCell>Platform</TableCell>
            <TableCell>Count</TableCell>
            <TableCell>Last Occurrence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((event, index) => (
              <TableRow key={index}>
                <TableCell>{event.name}</TableCell>
                <TableCell>{event.type}</TableCell>
                <TableCell>{event.platform}</TableCell>
                <TableCell>{event.count}</TableCell>
                <TableCell>{new Date(event.lastOccurrence).toLocaleString()}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={events.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default EventTable; 