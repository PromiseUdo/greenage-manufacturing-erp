// 'use client';

// import {
//   AppBar,
//   Toolbar,
//   Box,
//   Typography,
//   IconButton,
//   Avatar,
// } from '@mui/material';
// import NotificationsIcon from '@mui/icons-material/Notifications';

// export default function Topbar() {
//   return (
//     <AppBar
//       elevation={0}
//       position="fixed"
//       sx={{
//         bgcolor: 'background.paper',
//         borderBottom: '1px solid',
//         borderColor: 'divider',
//         color: 'text.primary',
//       }}
//     >
//       <Toolbar sx={{ minHeight: 64 }}>
//         <Box sx={{ flexGrow: 1 }} />

//         <IconButton>
//           <NotificationsIcon />
//         </IconButton>

//         <Avatar sx={{ width: 32, height: 32, ml: 2 }} src="/avatar.png" />
//       </Toolbar>
//     </AppBar>
//   );
// }

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
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Topbar() {
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image || '/avatar.png';

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
        {/* Left side - can add logo/menu button later */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" size="medium">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          {/* User Avatar + Dropdown */}
          <Tooltip title={userName}>
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ p: 0 }}
              disabled={isLoading}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
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
        </Box>

        {/* ──────────────── User Menu ──────────────── */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
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
          {/* User Info Header */}
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {userName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>

          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
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
