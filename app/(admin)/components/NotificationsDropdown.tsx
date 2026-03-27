'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grow,
  IconButton,
  Paper,
  Popper,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import {
  AppNotification,
  NotificationModule,
  useNotifications,
} from '@/lib/contexts/NotificationContext';

// ─── Per-module display config ────────────────────────────────────────────────

const MODULE_CONFIG: Record<
  NotificationModule,
  {
    label: string;
    viewAllLabel: string;
    viewAllLink: string;
    SectionIcon: React.ElementType;
    sectionColor: string;
  }
> = {
  INVENTORY: {
    label: 'Inventory · Material Requests',
    viewAllLabel: 'View all in Inventory',
    viewAllLink: '/inventory/production-requests',
    SectionIcon: InventoryIcon,
    sectionColor: '#3B82F6',
  },
  PRODUCTION: {
    label: 'Production · Product Returns',
    viewAllLabel: 'View all in Returns',
    viewAllLink: '/production/returns',
    SectionIcon: PrecisionManufacturingIcon,
    sectionColor: '#8B5CF6',
  },
};

// ─── Per-notification-type display config ─────────────────────────────────────

type RowTheme = {
  accentColor: string;
  Icon: React.ElementType;
  statusLabel: string;
};

function getRowTheme(notification: AppNotification): RowTheme {
  if (notification.type === 'PRODUCT_RETURN') {
    return {
      accentColor: '#8B5CF6',
      Icon: AssignmentReturnIcon,
      statusLabel: 'Received',
    };
  }
  // MATERIAL_REQUISITION
  const isPartial = notification.status === 'PARTIALLY_FULFILLED';
  return {
    accentColor: isPartial ? '#F59E0B' : '#3B82F6',
    Icon: InventoryIcon,
    statusLabel: isPartial ? 'Partial' : 'Pending',
  };
}

// ─── Time helper ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: AppNotification;
  onMarkRead: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { accentColor, Icon, statusLabel } = getRowTheme(notification);

  const detailParts: string[] = [];
  if (notification.type === 'MATERIAL_REQUISITION') {
    const count = notification.meta.itemCount as number | undefined;
    if (count != null)
      detailParts.push(`${count} item${count !== 1 ? 's' : ''}`);
  } else if (notification.type === 'PRODUCT_RETURN') {
    const condition = notification.meta.condition as string | null;
    if (condition) detailParts.push(condition);
  }
  detailParts.push(timeAgo(notification.createdAt));

  const handleClick = () => {
    onMarkRead();
    onClose();
    router.push(notification.link);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        borderLeft: `3px solid ${accentColor}`,
        bgcolor: alpha(accentColor, 0.04),
        transition: 'background 0.15s ease',
        '&:hover': { bgcolor: alpha(accentColor, 0.09) },
      }}
    >
      {/* Icon bubble */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(accentColor, 0.12),
          color: accentColor,
        }}
      >
        <Icon sx={{ fontSize: '1.1rem' }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ color: 'text.primary', flex: 1 }}
          >
            {notification.title}
          </Typography>
          <Box
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: '6px',
              bgcolor: alpha(accentColor, 0.12),
              color: accentColor,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {statusLabel}
          </Box>
        </Box>

        <Typography
          variant="caption"
          noWrap
          sx={{ color: 'text.primary', display: 'block', lineHeight: 1.4 }}
        >
          {notification.message}
        </Typography>

        <Typography
          variant="caption"
          noWrap
          sx={{
            color: 'text.secondary',
            display: 'block',
            mt: 0.25,
            fontSize: '0.7rem',
          }}
        >
          {notification.subtext}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.4 }}>
          {detailParts.map((part, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
              {i > 0 && (
                <Box
                  component="span"
                  sx={{ color: 'text.disabled', fontSize: '0.65rem' }}
                >
                  ·
                </Box>
              )}
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
              >
                {part}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Unread dot */}
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: accentColor,
          alignSelf: 'center',
          flexShrink: 0,
        }}
      />
    </Box>
  );
}

// ─── Module section block ─────────────────────────────────────────────────────

function ModuleSection({
  module,
  items,
  markRead,
  onClose,
}: {
  module: NotificationModule;
  items: AppNotification[];
  markRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const cfg = MODULE_CONFIG[module];

  const handleViewAll = () => {
    onClose();
    router.push(cfg.viewAllLink);
  };

  return (
    <Box>
      {/* Section header */}
      <Box
        sx={{
          px: 2.5,
          py: 0.85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha(cfg.sectionColor, 0.04),
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
          <cfg.SectionIcon
            sx={{ fontSize: '0.8rem', color: cfg.sectionColor }}
          />
          <Typography
            sx={{
              fontSize: '0.67rem',
              fontWeight: 700,
              color: cfg.sectionColor,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {cfg.label}
          </Typography>
        </Box>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '0.7rem !important' }} />}
          onClick={handleViewAll}
          sx={{
            fontSize: '0.67rem',
            textTransform: 'none',
            color: 'text.disabled',
            minWidth: 0,
            px: 0.5,
            py: 0.25,
            '&:hover': { color: cfg.sectionColor, bgcolor: 'transparent' },
          }}
        >
          View all
        </Button>
      </Box>

      {/* Rows */}
      {items.map((notif, index) => (
        <Box key={notif.id}>
          <NotificationRow
            notification={notif}
            onMarkRead={() => markRead(notif.id)}
            onClose={onClose}
          />
          {index < items.length - 1 && <Divider sx={{ mx: 2, opacity: 0.4 }} />}
        </Box>
      ))}
    </Box>
  );
}

// ─── Main dropdown ────────────────────────────────────────────────────────────

const MODULE_ORDER: NotificationModule[] = ['INVENTORY', 'PRODUCTION'];

export default function NotificationsDropdown() {
  const { notifications, unreadCount, loading, isRead, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  // Only show unread — read notifications are dismissed from the list
  const unread = notifications.filter((n) => !isRead(n.id));

  // Group by module, preserving sort order (newest first within each)
  const byModule = unread.reduce<
    Partial<Record<NotificationModule, AppNotification[]>>
  >((acc, n) => {
    acc[n.module] = [...(acc[n.module] ?? []), n];
    return acc;
  }, {});

  const renderedModules = MODULE_ORDER.filter(
    (m) => (byModule[m]?.length ?? 0) > 0,
  );
  const isEmpty = unread.length === 0;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          ref={anchorRef}
          onClick={toggle}
          color="inherit"
          size="medium"
          aria-label="Open notifications"
          sx={{ '&:hover': { bgcolor: alpha('#3B82F6', 0.08) } }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 18,
                minWidth: 18,
                fontWeight: 700,
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsIcon sx={{ fontSize: '1.35rem' }} />
            ) : (
              <NotificationsNoneIcon sx={{ fontSize: '1.35rem' }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        disablePortal={false}
        style={{ zIndex: 1300 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top right' }}>
            <Paper
              elevation={8}
              sx={{
                width: 390,
                maxHeight: 560,
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              }}
            >
              {/* ── Header ── */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Box
                      sx={{
                        px: 0.85,
                        py: 0.15,
                        borderRadius: '8px',
                        bgcolor: alpha('#EF4444', 0.1),
                        color: '#EF4444',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {unreadCount} new
                    </Box>
                  )}
                </Box>
                {unreadCount > 0 && (
                  <Tooltip title="Mark all as read">
                    <Button
                      size="small"
                      startIcon={<DoneAllIcon sx={{ fontSize: '0.85rem' }} />}
                      onClick={markAllRead}
                      sx={{
                        fontSize: '0.72rem',
                        color: 'text.secondary',
                        textTransform: 'none',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      Mark all read
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {/* ── Body ── */}
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 6 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : isEmpty ? (
                  <Box
                    sx={{
                      py: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        bgcolor: alpha('#3B82F6', 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <NotificationsNoneIcon
                        sx={{ color: '#3B82F6', fontSize: '1.5rem' }}
                      />
                    </Box>
                    {/* <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      All caught up!
                    </Typography> */}
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      textAlign="center"
                      px={4}
                    >
                      No pending notifications
                    </Typography>
                  </Box>
                ) : (
                  renderedModules.map((module, i) => (
                    <Box key={module}>
                      <ModuleSection
                        module={module}
                        items={byModule[module]!}
                        markRead={markRead}
                        onClose={close}
                      />
                      {i < renderedModules.length - 1 && (
                        <Box sx={{ height: 4 }} />
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grow>
        )}
      </Popper>

      {/* Click-away backdrop */}
      {open && (
        <Box
          onClick={close}
          sx={{ position: 'fixed', inset: 0, zIndex: 1299 }}
        />
      )}
    </>
  );
}
