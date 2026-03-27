'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'MATERIAL_REQUISITION' | 'PRODUCT_RETURN';
export type NotificationModule = 'INVENTORY' | 'PRODUCTION';

export interface AppNotification {
  id: string;
  type: NotificationType;
  module: NotificationModule;
  title: string;
  message: string;
  subtext: string;
  status: string;
  createdAt: string;
  link: string;
  meta: Record<string, unknown>;
}

// Which nav path each module feeds into for badge counts
const MODULE_PATH: Record<NotificationModule, string> = {
  INVENTORY: '/inventory/production-requests',
  PRODUCTION: '/production/returns',
};

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  /** Per sidebar-path unread count — use for nav badge */
  unreadByPath: Record<string, number>;
  loading: boolean;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

// ─── Local storage helpers ─────────────────────────────────────────────────────

const SEEN_KEY = 'notif_seen_v1';

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // storage quota exceeded — ignore
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  unreadByPath: {},
  loading: true,
  isRead: () => false,
  markRead: () => undefined,
  markAllRead: () => undefined,
  refresh: () => undefined,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silent — network issues shouldn't crash the UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSeenIds(loadSeen());
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Total unread across all modules
  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  // Per nav-path unread counts for sidebar badges
  const unreadByPath: Record<string, number> = {};
  for (const n of notifications) {
    if (seenIds.has(n.id)) continue;
    const path = MODULE_PATH[n.module];
    unreadByPath[path] = (unreadByPath[path] ?? 0) + 1;
  }

  const isRead = useCallback((id: string) => seenIds.has(id), [seenIds]);

  const markRead = useCallback(
    (id: string) => {
      const next = new Set([...seenIds, id]);
      setSeenIds(next);
      saveSeen(next);
    },
    [seenIds],
  );

  const markAllRead = useCallback(() => {
    const next = new Set([...seenIds, ...notifications.map((n) => n.id)]);
    setSeenIds(next);
    saveSeen(next);
  }, [seenIds, notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadByPath,
        loading,
        isRead,
        markRead,
        markAllRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
