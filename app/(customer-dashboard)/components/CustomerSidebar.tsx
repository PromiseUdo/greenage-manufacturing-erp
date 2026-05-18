'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import { useSession, signOut } from 'next-auth/react';
import { SvgIconProps } from '@mui/material';

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 72;

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<SvgIconProps>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/customer/overview', icon: DashboardIcon },
  { label: 'Products', path: '/customer/products', icon: Inventory2OutlinedIcon },
  { label: 'Quotes', path: '/customer/quotes', icon: DescriptionIcon },
  { label: 'Invoices', path: '/customer/invoices', icon: ReceiptIcon },
  { label: 'Orders', path: '/customer/orders', icon: ShoppingCartIcon },
];

export default function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const userName = session?.user?.name || 'Customer';
  const isLoading = status === 'loading';

  useEffect(() => {
    const stored = localStorage.getItem('customer-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('customer-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
          bgcolor: '#020617',
          borderRight: `1px solid ${alpha('#ffffff', 0.05)}`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 100%)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Box component="img"
            src="/greenage_logo.png"
            alt="GreenAge"
            sx={{ height: 28, width: 'auto' }}
          />
        )}
        <IconButton
          onClick={() => setCollapsed((c) => !c)}
          sx={{
            bgcolor: alpha('#ffffff', 0.03),
            color: '#94A3B8',
            '&:hover': { bgcolor: alpha('#ffffff', 0.08), color: '#fff' },
          }}
        >
          {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>
      </Box>

      {/* Section label */}
      {!collapsed && (
        <Typography
          sx={{
            px: 4,
            mb: 1.5,
            mt: 1,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          Customer Portal
        </Typography>
      )}

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List disablePadding sx={{ px: collapsed ? 1 : 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

            return (
              <Box key={item.label} sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => router.push(item.path)}
                    sx={{
                      minHeight: 48,
                      borderRadius: '12px',
                      px: collapsed ? 0 : 2,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      color: isActive ? '#fff' : '#94A3B8',
                      bgcolor: isActive ? alpha('#10b981', 0.8) : 'transparent',
                      '&:hover': {
                        bgcolor: isActive ? '#10b981' : alpha('#ffffff', 0.05),
                        color: '#fff',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 38,
                        color: 'inherit',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: '1.3rem' }} />
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                          letterSpacing: '0.01em',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </Box>
            );
          })}
        </List>
      </Box>

      {/* User info at bottom */}
      {!collapsed && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: alpha('#ffffff', 0.03),
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              border: `1px solid ${alpha('#ffffff', 0.05)}`,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              {userName.substring(0, 2).toUpperCase()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ color: '#fff', fontSize: '0.825rem', fontWeight: 500, lineHeight: 1.2 }}
              >
                {isLoading ? 'Loading...' : userName}
              </Typography>
              <Typography
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                sx={{
                  color: '#64748B',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  mt: 0.5,
                  display: 'inline-block',
                  '&:hover': { color: '#EF4444', textDecoration: 'underline' },
                  transition: 'color 0.2s',
                }}
              >
                Sign out
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
