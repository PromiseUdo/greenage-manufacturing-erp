'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import CustomerTopbar from './components/CustomerTopbar';
import CustomerSidebar from './components/CustomerSidebar';

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CustomerTopbar />
      <CustomerSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '76px',
          px: 3,
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
