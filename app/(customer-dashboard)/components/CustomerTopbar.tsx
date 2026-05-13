'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

export default function CustomerTopbar() {
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const userName = session?.user?.name || 'Customer';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image || '';
  const isLoading = status === 'loading';

  return (
    <AppBar
      elevation={0}
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={userName}>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{ p: 0 }}
            disabled={isLoading}
          >
            <Avatar
              alt={userName}
              src={userImage}
              sx={{
                width: 38,
                height: 38,
                border: '2px solid',
                borderColor: 'divider',
                bgcolor: 'primary.main',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {!userImage && userName?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          onClick={() => setAnchorEl(null)}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 1.5,
              minWidth: 240,
              borderRadius: 2,
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {userName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
