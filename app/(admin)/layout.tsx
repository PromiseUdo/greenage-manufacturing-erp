'use client';

import * as React from 'react';
import { Box, Toolbar } from '@mui/material';
import Topbar from './components/topbar';
import Sidebar from './components/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar />
      <Sidebar />

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
