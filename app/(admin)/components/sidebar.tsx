'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import { navigation } from '@/lib/navigation';

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 72;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
          overflowX: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxSizing: 'border-box',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          transition: 'padding 0.28s',
        }}
      >
        {!collapsed && (
          <Box
            sx={{
              pl: 1,
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <img
              src="/greenage_logo.png"
              alt="GreenAge logo"
              style={{
                width: '120px',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        )}

        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          size="small"
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'primary.main',
            },
          }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>
      <Divider />
      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          px: collapsed ? 1.5 : 0,
        }}
      >
        {navigation.map((group, groupIndex) => (
          <Box
            key={group.section}
            sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
          >
            {!collapsed && (
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  mb: 1,
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  lineHeight: 1.5,
                }}
              >
                {group.section}
              </Typography>
            )}

            {collapsed && groupIndex > 0 && (
              <Divider sx={{ my: 1.5, mx: 'auto', width: 32 }} />
            )}

            <List
              disablePadding
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
            >
              {group.items.map((item) => {
                const active = pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <Tooltip
                    key={item.path}
                    title={collapsed ? item.label : ''}
                    placement="right"
                    arrow
                    disableInteractive
                  >
                    <ListItemButton
                      onClick={() => router.push(item.path)}
                      sx={{
                        minHeight: 44,
                        borderRadius: collapsed ? 1.5 : 0,
                        px: collapsed ? 0 : 2,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        position: 'relative',
                        bgcolor: active ? 'action.selected' : 'transparent',
                        color: active ? 'primary.main' : 'text.secondary',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

                        '&:hover': {
                          bgcolor: active ? 'action.selected' : 'action.hover',
                          color: active ? 'primary.main' : 'text.primary',
                          transform: 'translateX(2px)',
                        },

                        // Active indicator bar
                        '&::before':
                          active && !collapsed
                            ? {
                                content: '""',
                                position: 'absolute',
                                right: 0, // ← key change
                                top: 0,
                                bottom: 0,
                                width: 3,
                                bgcolor: 'primary.main',
                              }
                            : {},

                        '&::after':
                          active && collapsed
                            ? {
                                content: '""',
                                position: 'absolute',
                                bottom: 6,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                              }
                            : {},
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 'unset' : 40,
                          color: 'inherit',
                          justifyContent: 'center',
                          '& svg': {
                            fontSize: 22,
                          },
                        }}
                      >
                        <Icon />
                      </ListItemIcon>

                      {!collapsed && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: active ? 600 : 500,
                            lineHeight: 1.5,
                            noWrap: true,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
