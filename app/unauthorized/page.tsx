'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { signOut } from 'next-auth/react';

export default function UnauthorizedPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        px: 3,
      }}
    >
      <Typography variant="h4" fontWeight={700}>
        Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        You do not have permission to view this page. Please sign in with an
        admin account.
      </Typography>
      <Button
        variant="contained"
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      >
        Sign out &amp; Sign in again
      </Button>
    </Box>
  );
}
