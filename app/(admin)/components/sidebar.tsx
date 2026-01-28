// 'use client';

// import { useState, useEffect } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import {
//   Box,
//   Drawer,
//   List,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   IconButton,
//   Divider,
//   Tooltip,
//   Collapse,
//   alpha,
//   Typography,
// } from '@mui/material';
// import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
// import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
// import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
// import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
// import { navigation, NavItem } from '@/lib/navigation';

// const DRAWER_WIDTH = 248;
// const MINI_WIDTH = 68;

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [collapsed, setCollapsed] = useState(() =>
//     typeof window !== 'undefined'
//       ? localStorage.getItem('sidebar-collapsed') === 'true'
//       : false,
//   );

//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true,
//   });

//   // Track if we temporarily expanded due to click on collapsed parent
//   const [tempExpanded, setTempExpanded] = useState(false);

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({
//       ...prev,
//       [label]: prev[label] !== true,
//     }));
//   };

//   const handleParentClick = (item: NavItem) => {
//     if (collapsed && item.children?.length) {
//       // Temporarily expand sidebar
//       setCollapsed(false);
//       setTempExpanded(true);
//       // Auto-open the section
//       setOpenSections((prev) => ({ ...prev, [item.label]: true }));
//     } else if (item.children?.length) {
//       toggleSection(item.label);
//     } else if (item.path) {
//       router.push(item.path);
//     }
//   };

//   // Collapse back after navigation (optional - can be removed if unwanted)
//   useEffect(() => {
//     if (tempExpanded) {
//       const timer = setTimeout(() => {
//         setCollapsed(true);
//         setTempExpanded(false);
//       }, 8000); // 8 seconds - adjust or remove

//       return () => clearTimeout(timer);
//     }
//   }, [tempExpanded, pathname]); // also collapse on route change

//   // ── Active state helpers ─────────────────────────────────────────────
//   const isExactActive = (path?: string) => path && pathname === path;

//   const hasActiveDescendant = (item: NavItem): boolean => {
//     if (isExactActive(item.path)) return true;
//     return !!item.children?.some(
//       (child) => isExactActive(child.path) || hasActiveDescendant(child),
//     );
//   };

//   const renderNavItems = (items: NavItem[], level = 0) => (
//     <List disablePadding sx={{ px: collapsed ? 0 : 1.5 }}>
//       {items.map((item) => {
//         const hasChildren = !!item.children?.length;
//         const isOpen = openSections[item.label] ?? true;
//         const Icon = item.icon;

//         const exactActive = isExactActive(item.path);
//         const hasActiveChild = !exactActive && hasActiveDescendant(item);

//         // ── Collapsed parent with children: now clickable ───────────────
//         if (collapsed && hasChildren) {
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 onClick={() => handleParentClick(item)}
//                 sx={{
//                   minHeight: 48,
//                   borderRadius: 2,
//                   justifyContent: 'center',
//                   color: hasActiveChild ? '#60A5FA' : '#94A3B8',
//                   my: 0.4,
//                   mx: collapsed ? 1 : 0,
//                   bgcolor: hasActiveChild
//                     ? alpha('#60A5FA', 0.12)
//                     : 'transparent',
//                   '&:hover': {
//                     bgcolor: alpha('#ffffff', 0.08),
//                   },
//                 }}
//               >
//                 <ListItemIcon sx={{ minWidth: 'auto' }}>
//                   <Icon
//                     sx={{
//                       color: collapsed ? '#ffffff' : 'inherit',
//                     }}
//                     fontSize="medium"
//                   />
//                 </ListItemIcon>
//               </ListItemButton>
//             </Tooltip>
//           );
//         }

//         return (
//           <Box key={item.label}>
//             <Tooltip
//               title={collapsed ? item.label : ''}
//               placement="right"
//               arrow
//               disableInteractive
//             >
//               <ListItemButton
//                 onClick={() => handleParentClick(item)}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 1.75,
//                   my: 0.35,
//                   pl: collapsed ? 0 : level * 2.2 + 2,
//                   pr: collapsed ? 0 : 2.5,
//                   justifyContent: collapsed ? 'center' : 'flex-start',

//                   color: exactActive
//                     ? '#60A5FA'
//                     : hasActiveChild || level > 0
//                       ? '#E2E8F0'
//                       : '#94A3B8',

//                   fontWeight: exactActive || hasActiveChild ? 600 : 500,

//                   bgcolor: exactActive
//                     ? alpha('#3B82F6', 0.09)
//                     : hasActiveChild
//                       ? alpha('#3B82F6', 0.035)
//                       : 'transparent',

//                   '&:hover': {
//                     bgcolor: exactActive
//                       ? alpha('#3B82F6', 0.16)
//                       : alpha('#ffffff', 0.055),
//                   },

//                   transition: 'all 0.2s ease',
//                   position: 'relative',

//                   '&::after':
//                     exactActive && !collapsed
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 6,
//                           top: '50%',
//                           transform: 'translateY(-50%)',
//                           height: 24,
//                           width: 3,
//                           borderRadius: 3,
//                           bgcolor: '#60A5FA',
//                           boxShadow: '0 0 8px rgba(96, 165, 250, 0.35)',
//                         }
//                       : hasActiveChild && !collapsed && level === 0
//                         ? {
//                             content: '""',
//                             position: 'absolute',
//                             left: 6,
//                             top: '50%',
//                             transform: 'translateY(-50%)',
//                             height: 14,
//                             width: 3,
//                             borderRadius: 3,
//                             bgcolor: alpha('#60A5FA', 0.55),
//                           }
//                         : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'auto' : 42,
//                     color: collapsed ? '#ffffff' : 'inherit',
//                   }}
//                 >
//                   <Icon fontSize="medium" />
//                 </ListItemIcon>

//                 {!collapsed && (
//                   <>
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: '0.875rem',
//                         fontWeight: 'inherit',
//                         color: 'inherit',
//                         noWrap: true,
//                       }}
//                     />
//                     {hasChildren &&
//                       (isOpen ? (
//                         <ExpandLessRoundedIcon
//                           fontSize="small"
//                           sx={{ opacity: 0.7 }}
//                         />
//                       ) : (
//                         <ExpandMoreRoundedIcon
//                           fontSize="small"
//                           sx={{ opacity: 0.7 }}
//                         />
//                       ))}
//                   </>
//                 )}
//               </ListItemButton>
//             </Tooltip>

//             {hasChildren && !collapsed && (
//               <Collapse in={isOpen} timeout={240}>
//                 {renderNavItems(item.children!, level + 1)}
//               </Collapse>
//             )}
//           </Box>
//         );
//       })}
//     </List>
//   );

//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
//         flexShrink: 0,
//         '& .MuiDrawer-paper': {
//           width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
//           bgcolor: '#0F172A',
//           borderRight: '1px solid',
//           borderColor: alpha('#ffffff', 0.06),
//           boxShadow: '0 0 0 0.5px rgba(255,255,255,0.025)',
//           transition: 'width 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
//           overflowX: 'hidden',
//         },
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           height: 72,
//           px: collapsed ? 1 : 2.5,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: collapsed ? 'center' : 'space-between',
//         }}
//       >
//         {!collapsed && (
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box
//               component="img"
//               src="/greenage_logo.png"
//               alt="GreenAge"
//               sx={{ height: 28, width: 'auto' }}
//             />
//           </Box>
//         )}

//         <IconButton
//           onClick={() => {
//             setCollapsed(!collapsed);
//             if (tempExpanded) setTempExpanded(false);
//           }}
//           size="small"
//           sx={{
//             color: '#94A3B8',
//             borderRadius: 1.75,
//             '&:hover': { bgcolor: alpha('#ffffff', 0.07) },
//           }}
//         >
//           {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
//         </IconButton>
//       </Box>

//       <Divider sx={{ borderColor: alpha('#ffffff', 0.07), mx: 2.5 }} />

//       {/* Navigation */}
//       <Box sx={{ flex: 1, overflowY: 'auto', py: 2.5 }}>
//         {navigation.map((group) => (
//           <Box key={group.section} sx={{ mb: 3.5 }}>
//             {!collapsed && (
//               <Typography
//                 variant="overline"
//                 sx={{
//                   px: 3,
//                   mb: 1.2,
//                   fontSize: '0.69rem',
//                   fontWeight: 700,
//                   letterSpacing: 0.9,
//                   color: '#64748B',
//                   display: 'block',
//                 }}
//               >
//                 {group.section.toUpperCase()}
//               </Typography>
//             )}

//             {renderNavItems(group.items)}
//           </Box>
//         ))}
//       </Box>
//     </Drawer>
//   );
// }

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
  IconButton,
  Divider,
  Tooltip,
  Collapse,
  alpha,
  Typography,
} from '@mui/material';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import { navigation, NavItem } from '@/lib/navigation';
import { useSession, signOut } from 'next-auth/react';

const DRAWER_WIDTH = 280; // Slightly wider for modern feel
const MINI_WIDTH = 80;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, status } = useSession();

  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image || '/avatar.png';

  const isLoading = status === 'loading';

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('sidebar-collapsed') === 'true'
      : false,
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Inventory: false,
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleParentClick = (item: NavItem) => {
    if (collapsed && item.children?.length) {
      setCollapsed(false);
      setOpenSections((prev) => ({ ...prev, [item.label]: true }));
    } else if (item.children?.length) {
      toggleSection(item.label);
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const isExactActive = (path?: string) => path && pathname === path;

  const hasActiveDescendant = (item: NavItem): boolean => {
    if (isExactActive(item.path)) return true;
    return !!item.children?.some(
      (child) => isExactActive(child.path) || hasActiveDescendant(child),
    );
  };

  const renderNavItems = (items: NavItem[], level = 0) => (
    <List disablePadding sx={{ px: collapsed ? 1 : 2 }}>
      {items.map((item) => {
        const hasChildren = !!item.children?.length;
        const isOpen = openSections[item.label] ?? false;
        const Icon = item.icon;
        const exactActive = isExactActive(item.path);
        const activeChild = !exactActive && hasActiveDescendant(item);

        return (
          <Box key={item.label} sx={{ mb: 0.5 }}>
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => handleParentClick(item)}
                sx={{
                  minHeight: 48,
                  borderRadius: '12px',
                  px: collapsed ? 0 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  // Modern Color Logic
                  color: exactActive
                    ? '#fff'
                    : activeChild
                      ? '#60A5FA'
                      : '#94A3B8',
                  bgcolor: exactActive
                    ? alpha('#3B82F6', 0.8) // Solid primary when active
                    : activeChild
                      ? alpha('#3B82F6', 0.1)
                      : 'transparent',

                  // Glossy glow for active item
                  // boxShadow: exactActive
                  //   ? `0 4px 12px ${alpha('#3B82F6', 0.4)}`
                  //   : 'none',

                  '&:hover': {
                    bgcolor: exactActive ? '#3B82F6' : alpha('#ffffff', 0.05),
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
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: exactActive ? 600 : 500,
                        letterSpacing: '0.01em',
                      }}
                    />
                    {hasChildren && (
                      <Box
                        sx={{
                          display: 'flex',
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: '0.2s',
                          opacity: 0.5,
                        }}
                      >
                        <ExpandMoreRoundedIcon sx={{ fontSize: '1.1rem' }} />
                      </Box>
                    )}
                  </>
                )}
              </ListItemButton>
            </Tooltip>

            {hasChildren && !collapsed && (
              <Collapse in={isOpen} timeout="auto">
                <List
                  disablePadding
                  sx={{
                    mt: 0.5,
                    ml: 1.5,
                    borderLeft: `1px solid ${alpha('#ffffff', 0.05)}`,
                  }}
                >
                  {renderNavItems(item.children!, level + 1)}
                </List>
              </Collapse>
            )}
          </Box>
        );
      })}
    </List>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
          bgcolor: '#020617', // Deeper slate black
          borderRight: `1px solid ${alpha('#ffffff', 0.05)}`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 100%)',
        },
      }}
    >
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/greenage_logo.png"
              alt="GreenAge"
              sx={{ height: 28, width: 'auto' }}
            />
          </Box>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            bgcolor: alpha('#ffffff', 0.03),
            color: '#94A3B8',
            '&:hover': { bgcolor: alpha('#ffffff', 0.08), color: '#fff' },
          }}
        >
          {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
        {navigation.map((group) => (
          <Box key={group.section} sx={{ mb: 4 }}>
            {!collapsed && (
              <Typography
                sx={{
                  px: 4,
                  mb: 2,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {group.section}
              </Typography>
            )}
            {renderNavItems(group.items)}
          </Box>
        ))}
      </Box>

      {/* Optional User Profile Section at bottom */}
      {!collapsed && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box
            sx={{
              p: collapsed ? 1 : 1.5,
              bgcolor: alpha('#ffffff', 0.03),
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 1.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.3s ease',
              border: `1px solid ${alpha('#ffffff', 0.05)}`,
            }}
          >
            {/* User Avatar / Initials */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              }}
            >
              {session?.user?.image ? (
                <Box
                  component="img"
                  src={session.user.image}
                  sx={{ width: '100%', height: '100%' }}
                />
              ) : (
                userName.substring(0, 2).toUpperCase()
              )}
            </Box>

            {!collapsed && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: '#fff',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {isLoading ? 'Loading...' : userName}
                </Typography>
                <Typography
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  sx={{
                    color: '#64748B',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                    mt: 0.5,
                    display: 'inline-block',
                    '&:hover': {
                      color: '#EF4444', // Red on hover for logout
                      textDecoration: 'underline',
                    },
                    transition: 'color 0.2s',
                  }}
                >
                  Sign out
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
