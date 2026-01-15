// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { usePathname, useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   Drawer,
// //   List,
// //   ListItemButton,
// //   ListItemIcon,
// //   ListItemText,
// //   Typography,
// //   IconButton,
// //   Divider,
// //   Tooltip,
// // } from '@mui/material';
// // import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// // import MenuIcon from '@mui/icons-material/Menu';
// // import { navigation } from '@/lib/navigation';

// // const DRAWER_WIDTH = 260;
// // const MINI_WIDTH = 72;

// // export default function Sidebar() {
// //   const pathname = usePathname();
// //   const router = useRouter();

// //   const [collapsed, setCollapsed] = useState(() => {
// //     if (typeof window !== 'undefined') {
// //       return localStorage.getItem('sidebar-collapsed') === 'true';
// //     }
// //     return false;
// //   });

// //   useEffect(() => {
// //     localStorage.setItem('sidebar-collapsed', String(collapsed));
// //   }, [collapsed]);

// //   return (
// //     <Drawer
// //       variant="permanent"
// //       sx={{
// //         width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
// //         flexShrink: 0,
// //         '& .MuiDrawer-paper': {
// //           width: collapsed ? MINI_WIDTH : DRAWER_WIDTH,
// //           overflowX: 'hidden',
// //           borderRight: '1px solid',
// //           borderColor: 'divider',
// //           bgcolor: '#C6C3B5',
// //           color: '#ffffff',
// //           boxSizing: 'border-box',
// //           transition: (theme) =>
// //             theme.transitions.create('width', {
// //               easing: theme.transitions.easing.sharp,
// //               duration: theme.transitions.duration.enteringScreen,
// //             }),
// //         },
// //       }}
// //     >
// //       {/* Header */}
// //       <Box
// //         sx={{
// //           height: 64,
// //           display: 'flex',
// //           alignItems: 'center',
// //           justifyContent: collapsed ? 'center' : 'space-between',
// //           px: collapsed ? 0 : 2,
// //           transition: 'padding 0.28s',
// //         }}
// //       >
// //         {!collapsed && (
// //           <Box
// //             sx={{
// //               pl: 1,
// //               opacity: collapsed ? 0 : 1,
// //               transition: 'opacity 0.2s',
// //             }}
// //           >
// //             <img
// //               src="/greenage_logo.png"
// //               alt="GreenAge logo"
// //               style={{
// //                 width: '120px',
// //                 height: 'auto',
// //                 display: 'block',
// //               }}
// //             />
// //           </Box>
// //         )}

// //         <IconButton
// //           onClick={() => setCollapsed(!collapsed)}
// //           size="small"
// //           sx={{
// //             color: 'text.secondary',
// //             transition: 'all 0.2s ease',
// //             '&:hover': {
// //               bgcolor: 'action.hover',
// //               color: 'primary.main',
// //             },
// //           }}
// //         >
// //           {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
// //         </IconButton>
// //       </Box>
// //       <Divider />
// //       {/* Navigation */}
// //       <Box
// //         sx={{
// //           flex: 1,
// //           overflowY: 'auto',
// //           overflowX: 'hidden',
// //           py: 2,
// //           px: collapsed ? 1.5 : 0,
// //         }}
// //       >
// //         {navigation.map((group, groupIndex) => (
// //           <Box
// //             key={group.section}
// //             sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
// //           >
// //             {!collapsed && (
// //               <Typography
// //                 variant="overline"
// //                 sx={{
// //                   px: 2,
// //                   mb: 1,
// //                   display: 'block',
// //                   color: '#ffffff',
// //                   fontSize: '0.70rem',
// //                   fontWeight: 600,
// //                   letterSpacing: '0.5px',
// //                   lineHeight: 1.5,
// //                 }}
// //               >
// //                 {group.section}
// //               </Typography>
// //             )}

// //             {collapsed && groupIndex > 0 && (
// //               <Divider sx={{ my: 1.5, mx: 'auto', width: 32 }} />
// //             )}

// //             <List
// //               disablePadding
// //               sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
// //             >
// //               {group.items.map((item) => {
// //                 const active = pathname.startsWith(item.path);
// //                 const Icon = item.icon;

// //                 return (
// //                   <Tooltip
// //                     key={item.path}
// //                     title={collapsed ? item.label : ''}
// //                     placement="right"
// //                     arrow
// //                     disableInteractive
// //                   >
// //                     <ListItemButton
// //                       onClick={() => router.push(item.path)}
// //                       sx={{
// //                         minHeight: 44,
// //                         borderRadius: collapsed ? 1.5 : 0,
// //                         px: collapsed ? 0 : 2,
// //                         justifyContent: collapsed ? 'center' : 'flex-start',
// //                         position: 'relative',
// //                         bgcolor: active ? 'action.selected' : 'transparent',
// //                         color: active ? 'primary.main' : 'text.secondary',
// //                         transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

// //                         '&:hover': {
// //                           bgcolor: active ? 'action.selected' : 'action.hover',
// //                           color: active ? 'primary.main' : 'text.primary',
// //                           transform: 'translateX(2px)',
// //                         },

// //                         // Active indicator bar
// //                         '&::before':
// //                           active && !collapsed
// //                             ? {
// //                                 content: '""',
// //                                 position: 'absolute',
// //                                 right: 0, // ← key change
// //                                 top: 0,
// //                                 bottom: 0,
// //                                 width: 3,
// //                                 bgcolor: 'primary.main',
// //                               }
// //                             : {},

// //                         '&::after':
// //                           active && collapsed
// //                             ? {
// //                                 content: '""',
// //                                 position: 'absolute',
// //                                 bottom: 6,
// //                                 left: '50%',
// //                                 transform: 'translateX(-50%)',
// //                                 width: 4,
// //                                 height: 4,
// //                                 borderRadius: '50%',
// //                                 bgcolor: 'primary.main',
// //                               }
// //                             : {},
// //                       }}
// //                     >
// //                       <ListItemIcon
// //                         sx={{
// //                           minWidth: collapsed ? 'unset' : 40,
// //                           color: 'inherit',
// //                           justifyContent: 'center',
// //                           '& svg': {
// //                             fontSize: 22,
// //                           },
// //                         }}
// //                       >
// //                         <Icon />
// //                       </ListItemIcon>

// //                       {!collapsed && (
// //                         <ListItemText
// //                           primary={item.label}
// //                           primaryTypographyProps={{
// //                             fontSize: 14,
// //                             fontWeight: active ? 600 : 500,
// //                             lineHeight: 1.5,
// //                             noWrap: true,
// //                           }}
// //                         />
// //                       )}
// //                     </ListItemButton>
// //                   </Tooltip>
// //                 );
// //               })}
// //             </List>
// //           </Box>
// //         ))}
// //       </Box>
// //     </Drawer>
// //   );
// // }

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
//   Typography,
//   IconButton,
//   Divider,
//   Tooltip,
//   Collapse,
// } from '@mui/material';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import MenuIcon from '@mui/icons-material/Menu';
// import { navigation, NavItem } from '@/lib/navigation';

// const DRAWER_WIDTH = 260;
// const MINI_WIDTH = 72;

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [collapsed, setCollapsed] = useState(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('sidebar-collapsed') === 'true';
//     }
//     return false;
//   });

//   // Track open state for collapsible sections (key = label for simplicity)
//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true, // default open – adjust as needed
//   });

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
//   };

//   // Recursive render function for nav items (handles nesting)
//   const renderNavItems = (items: NavItem[], level = 0) => (
//     <List
//       disablePadding
//       sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
//     >
//       {items.map((item) => {
//         const isActive = item.path ? pathname.startsWith(item.path) : false;
//         const hasChildren = !!item.children?.length;
//         const isOpen = openSections[item.label] ?? false;
//         const Icon = item.icon;

//         // For collapsed mode → show tooltip + active dot
//         if (collapsed && !item.path) {
//           // Parent with children → just show icon (no click action in mini mode)
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 disabled
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 1.5,
//                   px: 0,
//                   justifyContent: 'center',
//                   color: 'text.secondary',
//                 }}
//               >
//                 <ListItemIcon sx={{ minWidth: 'unset', color: 'inherit' }}>
//                   <Icon />
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
//                 onClick={() => {
//                   if (hasChildren) {
//                     toggleSection(item.label);
//                   } else if (item.path) {
//                     router.push(item.path);
//                   }
//                 }}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: collapsed ? 1.5 : 0,
//                   px: collapsed ? 0 : 2,
//                   justifyContent: collapsed ? 'center' : 'flex-start',
//                   bgcolor: isActive ? 'action.selected' : 'transparent',
//                   color: isActive ? 'primary.main' : 'text.secondary',
//                   pl: level * 3 + 2, // indent nested items
//                   transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

//                   '&:hover': {
//                     bgcolor: isActive ? 'action.selected' : 'action.hover',
//                     color: isActive ? 'primary.main' : 'text.primary',
//                   },

//                   // Active indicator
//                   position: 'relative',
//                   '&::before':
//                     isActive && !collapsed
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 0,
//                           top: 0,
//                           bottom: 0,
//                           width: 3,
//                           bgcolor: 'primary.main',
//                         }
//                       : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'unset' : 40,
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon />
//                 </ListItemIcon>

//                 {!collapsed && (
//                   <>
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 14,
//                         fontWeight: isActive ? 600 : 500,
//                         noWrap: true,
//                       }}
//                     />
//                     {hasChildren &&
//                       (isOpen ? (
//                         <ExpandLess fontSize="small" />
//                       ) : (
//                         <ExpandMore fontSize="small" />
//                       ))}
//                   </>
//                 )}
//               </ListItemButton>
//             </Tooltip>

//             {hasChildren && !collapsed && (
//               <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
//           overflowX: 'hidden',
//           borderRight: '1px solid',
//           borderColor: 'divider',
//           bgcolor: '#C6C3B5',
//           color: '#ffffff',
//           boxSizing: 'border-box',
//           transition: (theme) =>
//             theme.transitions.create('width', {
//               easing: theme.transitions.easing.sharp,
//               duration: theme.transitions.duration.enteringScreen,
//             }),
//         },
//       }}
//     >
//       {/* Header + Toggle */}
//       <Box
//         sx={{
//           height: 64,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: collapsed ? 'center' : 'space-between',
//           px: collapsed ? 0 : 2,
//         }}
//       >
//         {!collapsed && (
//           <Box sx={{ pl: 1 }}>
//             <img
//               src="/greenage_logo.png"
//               alt="GreenAge logo"
//               style={{ width: '120px', height: 'auto' }}
//             />
//           </Box>
//         )}

//         <IconButton
//           onClick={() => setCollapsed(!collapsed)}
//           size="small"
//           sx={{ color: 'text.secondary' }}
//         >
//           {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
//         </IconButton>
//       </Box>

//       <Divider />

//       {/* Navigation */}
//       <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: collapsed ? 1.5 : 0 }}>
//         {navigation.map((group, groupIndex) => (
//           <Box
//             key={group.section}
//             sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
//           >
//             {!collapsed && (
//               <Typography
//                 variant="overline"
//                 sx={{
//                   px: 2,
//                   mb: 1,
//                   display: 'block',
//                   color: '#ffffff',
//                   fontSize: '0.70rem',
//                   fontWeight: 600,
//                 }}
//               >
//                 {group.section}
//               </Typography>
//             )}

//             {renderNavItems(group.items)}
//           </Box>
//         ))}
//       </Box>
//     </Drawer>
//   );
// }

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
//   Typography,
//   IconButton,
//   Divider,
//   Tooltip,
//   Collapse,
// } from '@mui/material';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import MenuIcon from '@mui/icons-material/Menu';
// import { navigation, NavItem } from '@/lib/navigation';

// const DRAWER_WIDTH = 260;
// const MINI_WIDTH = 72;

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [collapsed, setCollapsed] = useState(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('sidebar-collapsed') === 'true';
//     }
//     return false;
//   });

//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true, // default open section
//   });

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
//   };

//   // Recursive render for nested items
//   const renderNavItems = (items: NavItem[], level = 0) => (
//     <List
//       disablePadding
//       sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
//     >
//       {items.map((item) => {
//         // const isActive = item.path ? pathname.startsWith(item.path) : false;
//         const checkIsActive = (item: NavItem): boolean => {
//           if (item.path && pathname === item.path) return true; // exact match
//           if (item.children) {
//             return item.children.some((child) => checkIsActive(child));
//           }
//           return false;
//         };
//         const hasChildren = !!item.children?.length;
//         const isOpen = openSections[item.label] ?? false;
//         const Icon = item.icon;

//         // Collapsed mode tooltip for parent items
//         if (collapsed && !item.path) {
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 disabled
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 2,
//                   px: 0,
//                   justifyContent: 'center',
//                   color: '#9CA3AF', // light gray
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: 'unset',
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
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
//                 onClick={() => {
//                   if (hasChildren) toggleSection(item.label);
//                   else if (item.path) router.push(item.path);
//                 }}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 2,
//                   px: collapsed ? 0 : 2,
//                   justifyContent: collapsed ? 'center' : 'flex-start',
//                   bgcolor: isActive ? '#1E40AF' : 'transparent', // active bg
//                   color: isActive ? '#F9FAFB' : '#9CA3AF', // active vs normal
//                   pl: level * 3 + 2,
//                   transition: 'all 0.2s',
//                   '&:hover': {
//                     bgcolor: isActive ? '#1E40AF' : '#374151',
//                     color: '#F9FAFB',
//                     transform: 'translateX(2px)',
//                   },
//                   position: 'relative',
//                   '&::before':
//                     isActive && !collapsed
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 0,
//                           top: 0,
//                           bottom: 0,
//                           width: 4,
//                           bgcolor: '#3B82F6',
//                           borderRadius: 2,
//                         }
//                       : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'unset' : 40,
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
//                 </ListItemIcon>

//                 {!collapsed && (
//                   <>
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 14,
//                         fontWeight: isActive ? 600 : 500,
//                         noWrap: true,
//                       }}
//                     />
//                     {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
//                   </>
//                 )}
//               </ListItemButton>
//             </Tooltip>

//             {hasChildren && !collapsed && (
//               <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
//           overflowX: 'hidden',
//           borderRight: '1px solid #374151',
//           bgcolor: '#1F2937',
//           color: '#F9FAFB',
//           boxSizing: 'border-box',
//           transition: (theme) =>
//             theme.transitions.create('width', {
//               easing: theme.transitions.easing.sharp,
//               duration: theme.transitions.duration.enteringScreen,
//             }),
//         },
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           height: 64,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: collapsed ? 'center' : 'space-between',
//           px: collapsed ? 0 : 2,
//         }}
//       >
//         {!collapsed && (
//           <Box sx={{ pl: 1 }}>
//             <img
//               src="/greenage_logo.png"
//               alt="GreenAge logo"
//               style={{ width: '120px', height: 'auto' }}
//             />
//           </Box>
//         )}

//         <IconButton
//           onClick={() => setCollapsed(!collapsed)}
//           size="small"
//           sx={{
//             color: '#9CA3AF',
//             '&:hover': { color: '#3B82F6', bgcolor: 'transparent' },
//           }}
//         >
//           {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
//         </IconButton>
//       </Box>

//       <Divider sx={{ borderColor: '#374151' }} />

//       {/* Navigation */}
//       <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: collapsed ? 1.5 : 0 }}>
//         {navigation.map((group, groupIndex) => (
//           <Box
//             key={group.section}
//             sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
//           >
//             {!collapsed && (
//               <Typography
//                 variant="overline"
//                 sx={{
//                   px: 2,
//                   mb: 1,
//                   display: 'block',
//                   color: '#F9FAFB',
//                   fontSize: '0.70rem',
//                   fontWeight: 600,
//                 }}
//               >
//                 {group.section}
//               </Typography>
//             )}
//             {renderNavItems(group.items)}
//           </Box>
//         ))}
//       </Box>
//     </Drawer>
//   );
// // }
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
//   Typography,
//   IconButton,
//   Divider,
//   Tooltip,
//   Collapse,
// } from '@mui/material';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import MenuIcon from '@mui/icons-material/Menu';
// import { navigation, NavItem } from '@/lib/navigation';

// const DRAWER_WIDTH = 260;
// const MINI_WIDTH = 72;

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [collapsed, setCollapsed] = useState(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('sidebar-collapsed') === 'true';
//     }
//     return false;
//   });

//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true, // default open section
//   });

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
//   };

//   // Recursive function to check active state
//   const checkIsActive = (item: NavItem): boolean => {
//     if (item.path && pathname === item.path) return true; // exact match
//     if (item.children)
//       return item.children.some((child) => checkIsActive(child));
//     return false;
//   };

//   // Recursive render for nav items
//   const renderNavItems = (items: NavItem[], level = 0) => (
//     <List
//       disablePadding
//       sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
//     >
//       {items.map((item) => {
//         const hasChildren = !!item.children?.length;
//         const isOpen = openSections[item.label] ?? false;
//         const Icon = item.icon;
//         const isActive = checkIsActive(item);
//         const isActiveChild = checkIsActive(item);
//         // Collapsed mode tooltip for parent items
//         if (collapsed && !item.path) {
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 disabled
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 2,
//                   px: 0,
//                   justifyContent: 'center',
//                   color: '#9CA3AF',
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: 'unset',
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
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
//                 onClick={() => {
//                   if (hasChildren) toggleSection(item.label);
//                   else if (item.path) router.push(item.path);
//                 }}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 2,
//                   px: collapsed ? 0 : 2,
//                   justifyContent: collapsed ? 'center' : 'flex-start',
//                   pl: level * 3 + 2,
//                   bgcolor: isActive
//                     ? '#1E40AF'
//                     : !item.path && isActiveChild
//                     ? 'rgba(59, 130, 246, 0.1)' // parent subtle highlight
//                     : 'transparent',
//                   color: isActive ? '#F9FAFB' : '#9CA3AF',
//                   transition: 'all 0.2s',
//                   position: 'relative',
//                   '&:hover': {
//                     bgcolor: isActive ? '#1E40AF' : '#374151',
//                     color: '#F9FAFB',
//                     transform: 'translateX(2px)',
//                   },
//                   '&::before':
//                     isActive && !collapsed
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 0,
//                           top: 0,
//                           bottom: 0,
//                           width: 4,
//                           bgcolor: '#3B82F6',
//                           borderRadius: 2,
//                         }
//                       : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'unset' : 40,
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
//                 </ListItemIcon>

//                 {!collapsed && (
//                   <>
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 14,
//                         fontWeight: isActive ? 600 : 500,
//                         noWrap: true,
//                       }}
//                     />
//                     {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
//                   </>
//                 )}
//               </ListItemButton>
//             </Tooltip>

//             {hasChildren && !collapsed && (
//               <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
//           overflowX: 'hidden',
//           borderRight: '1px solid #374151',
//           bgcolor: '#1F2937',
//           color: '#F9FAFB',
//           boxSizing: 'border-box',
//           transition: (theme) =>
//             theme.transitions.create('width', {
//               easing: theme.transitions.easing.sharp,
//               duration: theme.transitions.duration.enteringScreen,
//             }),
//         },
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           height: 64,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: collapsed ? 'center' : 'space-between',
//           px: collapsed ? 0 : 2,
//         }}
//       >
//         {!collapsed && (
//           <Box sx={{ pl: 1 }}>
//             <img
//               src="/greenage_logo.png"
//               alt="GreenAge logo"
//               style={{ width: '120px', height: 'auto' }}
//             />
//           </Box>
//         )}

//         <IconButton
//           onClick={() => setCollapsed(!collapsed)}
//           size="small"
//           sx={{
//             color: '#9CA3AF',
//             '&:hover': { color: '#3B82F6', bgcolor: 'transparent' },
//           }}
//         >
//           {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
//         </IconButton>
//       </Box>

//       <Divider sx={{ borderColor: '#374151' }} />

//       {/* Navigation */}
//       <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: collapsed ? 1.5 : 0 }}>
//         {navigation.map((group, groupIndex) => (
//           <Box
//             key={group.section}
//             sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
//           >
//             {!collapsed && (
//               <Typography
//                 variant="overline"
//                 sx={{
//                   px: 2,
//                   mb: 1,
//                   display: 'block',
//                   color: '#F9FAFB',
//                   fontSize: '0.70rem',
//                   fontWeight: 600,
//                 }}
//               >
//                 {group.section}
//               </Typography>
//             )}
//             {renderNavItems(group.items)}
//           </Box>
//         ))}
//       </Box>
//     </Drawer>
//   );
// }

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
//   Typography,
//   IconButton,
//   Divider,
//   Tooltip,
//   Collapse,
// } from '@mui/material';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import MenuIcon from '@mui/icons-material/Menu';
// import { navigation, NavItem } from '@/lib/navigation';

// const DRAWER_WIDTH = 260;
// const MINI_WIDTH = 72;

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [collapsed, setCollapsed] = useState(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('sidebar-collapsed') === 'true';
//     }
//     return false;
//   });

//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true,
//   });

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
//   };

//   // Recursive check if any child is active
//   const checkIsActive = (item: NavItem): boolean => {
//     if (item.path && pathname === item.path) return true;
//     if (item.children)
//       return item.children.some((child) => checkIsActive(child));
//     return false;
//   };

//   const renderNavItems = (items: NavItem[], level = 0) => (
//     <List
//       disablePadding
//       sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
//     >
//       {items.map((item) => {
//         const hasChildren = !!item.children?.length;
//         const isOpen = openSections[item.label] ?? false;
//         const Icon = item.icon;

//         const isActive = item.path ? pathname === item.path : false; // exact match
//         const isActiveChild =
//           !item.path && hasChildren
//             ? item.children!.some((child) => checkIsActive(child))
//             : false;

//         // Collapsed mode tooltip for parent items
//         if (collapsed && !item.path) {
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 disabled
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 2,
//                   px: 0,
//                   justifyContent: 'center',
//                   color: '#9CA3AF',
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: 'unset',
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
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
//                 onClick={() => {
//                   if (hasChildren) toggleSection(item.label);
//                   else if (item.path) router.push(item.path);
//                 }}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 0,
//                   px: collapsed ? 0 : 2,
//                   justifyContent: collapsed ? 'center' : 'flex-start',
//                   pl: level * 3 + 2,
//                   bgcolor: isActive
//                     ? '#1E40AF' // active leaf
//                     : isActiveChild
//                     ? 'rgba(59, 130, 246, 0.1)' // parent subtle highlight
//                     : 'transparent',
//                   color: isActive ? '#F9FAFB' : '#9CA3AF',
//                   transition: 'all 0.2s',
//                   position: 'relative',
//                   '&:hover': {
//                     bgcolor: isActive ? '#1E40AF' : '#374151',
//                     color: '#F9FAFB',
//                     transform: 'translateX(2px)',
//                   },
//                   '&::before':
//                     isActive && !collapsed
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 0,
//                           top: 0,
//                           bottom: 0,
//                           width: 4,
//                           bgcolor: '#3B82F6',
//                           borderRadius: 2,
//                         }
//                       : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'unset' : 40,
//                     color: 'inherit',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 24 }} />
//                 </ListItemIcon>

//                 {!collapsed && (
//                   <>
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 14,
//                         fontWeight: isActive ? 600 : 500,
//                         noWrap: true,
//                       }}
//                     />
//                     {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
//                   </>
//                 )}
//               </ListItemButton>
//             </Tooltip>

//             {hasChildren && !collapsed && (
//               <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
//           overflowX: 'hidden',
//           borderRight: '1px solid #374151',
//           bgcolor: '#1F2937',
//           color: '#F9FAFB',
//           boxSizing: 'border-box',
//           transition: (theme) =>
//             theme.transitions.create('width', {
//               easing: theme.transitions.easing.sharp,
//               duration: theme.transitions.duration.enteringScreen,
//             }),
//         },
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           height: 64,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: collapsed ? 'center' : 'space-between',
//           px: collapsed ? 0 : 2,
//         }}
//       >
//         {!collapsed && (
//           <Box sx={{ pl: 1 }}>
//             <img
//               src="/greenage_logo.png"
//               alt="GreenAge logo"
//               style={{ width: '120px', height: 'auto' }}
//             />
//           </Box>
//         )}

//         <IconButton
//           onClick={() => setCollapsed(!collapsed)}
//           size="small"
//           sx={{
//             color: '#9CA3AF',
//             '&:hover': { color: '#3B82F6', bgcolor: 'transparent' },
//           }}
//         >
//           {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
//         </IconButton>
//       </Box>

//       <Divider sx={{ borderColor: '#374151' }} />

//       {/* Navigation */}
//       <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: collapsed ? 1.5 : 0 }}>
//         {navigation.map((group, groupIndex) => (
//           <Box
//             key={group.section}
//             sx={{ mb: groupIndex < navigation.length - 1 ? 3 : 0 }}
//           >
//             {!collapsed && (
//               <Typography
//                 variant="overline"
//                 sx={{
//                   px: 2,
//                   mb: 1,
//                   display: 'block',
//                   color: '#F9FAFB',
//                   fontSize: '0.70rem',
//                   fontWeight: 600,
//                 }}
//               >
//                 {group.section}
//               </Typography>
//             )}
//             {renderNavItems(group.items)}
//           </Box>
//         ))}
//       </Box>
//     </Drawer>
//   );
// }

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
//       : false
//   );

//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     Inventory: true,
//   });

//   useEffect(() => {
//     localStorage.setItem('sidebar-collapsed', String(collapsed));
//   }, [collapsed]);

//   const toggleSection = (label: string) => {
//     setOpenSections((prev) => ({
//       ...prev,
//       [label]: prev[label] !== true, // false/undefined → true, true → false
//     }));
//   };

//   // ── Active state helpers ─────────────────────────────────────────────
//   const isExactActive = (path?: string) => path && pathname === path;

//   const hasActiveDescendant = (item: NavItem): boolean => {
//     if (isExactActive(item.path)) return true;
//     return !!item.children?.some(
//       (child) => isExactActive(child.path) || hasActiveDescendant(child)
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

//         // Collapsed mode - parent items only (with tooltip)
//         if (collapsed && hasChildren) {
//           return (
//             <Tooltip
//               key={item.label}
//               title={item.label}
//               placement="right"
//               arrow
//             >
//               <ListItemButton
//                 disabled
//                 sx={{
//                   minHeight: 48,
//                   borderRadius: 2,
//                   justifyContent: 'center',
//                   color: '#94A3B8',
//                   my: 0.4,
//                 }}
//               >
//                 <ListItemIcon sx={{ minWidth: 'auto' }}>
//                   <Icon fontSize="medium" />
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
//                 onClick={() => {
//                   if (hasChildren) toggleSection(item.label);
//                   else if (item.path) router.push(item.path);
//                 }}
//                 sx={{
//                   minHeight: 44,
//                   borderRadius: 1.75,
//                   my: 0.35,
//                   pl: collapsed ? 0 : level * 2.2 + 2,
//                   pr: collapsed ? 0 : 2.5,
//                   justifyContent: collapsed ? 'center' : 'flex-start',

//                   // ── Improved readable color palette ──────────────────────
//                   color: exactActive
//                     ? '#60A5FA' // bright blue for active
//                     : hasActiveChild || level > 0
//                     ? '#E2E8F0' // light off-white - high readability
//                     : '#94A3B8', // medium gray - calm default

//                   fontWeight: exactActive || hasActiveChild ? 600 : 500,

//                   bgcolor: exactActive
//                     ? alpha('#3B82F6', 0.09)
//                     : hasActiveChild
//                     ? alpha('#3B82F6', 0.035)
//                     : 'transparent',

//                   '&:hover': {
//                     bgcolor: exactActive
//                       ? alpha('#3B82F6', 0.16)
//                       : alpha('#ffffff', 0.055),
//                   },

//                   transition: 'all 0.2s ease',
//                   position: 'relative',

//                   // Thin active indicator line
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
//                       ? {
//                           content: '""',
//                           position: 'absolute',
//                           left: 6,
//                           top: '50%',
//                           transform: 'translateY(-50%)',
//                           height: 14,
//                           width: 3,
//                           borderRadius: 3,
//                           bgcolor: alpha('#60A5FA', 0.55),
//                         }
//                       : {},
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: collapsed ? 'auto' : 42,
//                     color: 'inherit',
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
//           onClick={() => setCollapsed(!collapsed)}
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
//                   color: '#64748B', // dim gray for section titles
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

const DRAWER_WIDTH = 248;
const MINI_WIDTH = 68;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('sidebar-collapsed') === 'true'
      : false
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Inventory: true,
  });

  // Track if we temporarily expanded due to click on collapsed parent
  const [tempExpanded, setTempExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: prev[label] !== true,
    }));
  };

  const handleParentClick = (item: NavItem) => {
    if (collapsed && item.children?.length) {
      // Temporarily expand sidebar
      setCollapsed(false);
      setTempExpanded(true);
      // Auto-open the section
      setOpenSections((prev) => ({ ...prev, [item.label]: true }));
    } else if (item.children?.length) {
      toggleSection(item.label);
    } else if (item.path) {
      router.push(item.path);
    }
  };

  // Collapse back after navigation (optional - can be removed if unwanted)
  useEffect(() => {
    if (tempExpanded) {
      const timer = setTimeout(() => {
        setCollapsed(true);
        setTempExpanded(false);
      }, 8000); // 8 seconds - adjust or remove

      return () => clearTimeout(timer);
    }
  }, [tempExpanded, pathname]); // also collapse on route change

  // ── Active state helpers ─────────────────────────────────────────────
  const isExactActive = (path?: string) => path && pathname === path;

  const hasActiveDescendant = (item: NavItem): boolean => {
    if (isExactActive(item.path)) return true;
    return !!item.children?.some(
      (child) => isExactActive(child.path) || hasActiveDescendant(child)
    );
  };

  const renderNavItems = (items: NavItem[], level = 0) => (
    <List disablePadding sx={{ px: collapsed ? 0 : 1.5 }}>
      {items.map((item) => {
        const hasChildren = !!item.children?.length;
        const isOpen = openSections[item.label] ?? true;
        const Icon = item.icon;

        const exactActive = isExactActive(item.path);
        const hasActiveChild = !exactActive && hasActiveDescendant(item);

        // ── Collapsed parent with children: now clickable ───────────────
        if (collapsed && hasChildren) {
          return (
            <Tooltip
              key={item.label}
              title={item.label}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => handleParentClick(item)}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  justifyContent: 'center',
                  color: hasActiveChild ? '#60A5FA' : '#94A3B8',
                  my: 0.4,
                  mx: collapsed ? 1 : 0,
                  bgcolor: hasActiveChild
                    ? alpha('#60A5FA', 0.12)
                    : 'transparent',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 'auto' }}>
                  <Icon
                    sx={{
                      color: collapsed ? '#ffffff' : 'inherit',
                    }}
                    fontSize="medium"
                  />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          );
        }

        return (
          <Box key={item.label}>
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              arrow
              disableInteractive
            >
              <ListItemButton
                onClick={() => handleParentClick(item)}
                sx={{
                  minHeight: 44,
                  borderRadius: 1.75,
                  my: 0.35,
                  pl: collapsed ? 0 : level * 2.2 + 2,
                  pr: collapsed ? 0 : 2.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',

                  color: exactActive
                    ? '#60A5FA'
                    : hasActiveChild || level > 0
                    ? '#E2E8F0'
                    : '#94A3B8',

                  fontWeight: exactActive || hasActiveChild ? 600 : 500,

                  bgcolor: exactActive
                    ? alpha('#3B82F6', 0.09)
                    : hasActiveChild
                    ? alpha('#3B82F6', 0.035)
                    : 'transparent',

                  '&:hover': {
                    bgcolor: exactActive
                      ? alpha('#3B82F6', 0.16)
                      : alpha('#ffffff', 0.055),
                  },

                  transition: 'all 0.2s ease',
                  position: 'relative',

                  '&::after':
                    exactActive && !collapsed
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 24,
                          width: 3,
                          borderRadius: 3,
                          bgcolor: '#60A5FA',
                          boxShadow: '0 0 8px rgba(96, 165, 250, 0.35)',
                        }
                      : hasActiveChild && !collapsed && level === 0
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 14,
                          width: 3,
                          borderRadius: 3,
                          bgcolor: alpha('#60A5FA', 0.55),
                        }
                      : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 42,
                    color: collapsed ? '#ffffff' : 'inherit',
                  }}
                >
                  <Icon fontSize="medium" />
                </ListItemIcon>

                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 'inherit',
                        color: 'inherit',
                        noWrap: true,
                      }}
                    />
                    {hasChildren &&
                      (isOpen ? (
                        <ExpandLessRoundedIcon
                          fontSize="small"
                          sx={{ opacity: 0.7 }}
                        />
                      ) : (
                        <ExpandMoreRoundedIcon
                          fontSize="small"
                          sx={{ opacity: 0.7 }}
                        />
                      ))}
                  </>
                )}
              </ListItemButton>
            </Tooltip>

            {hasChildren && !collapsed && (
              <Collapse in={isOpen} timeout={240}>
                {renderNavItems(item.children!, level + 1)}
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
          bgcolor: '#0F172A',
          borderRight: '1px solid',
          borderColor: alpha('#ffffff', 0.06),
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.025)',
          transition: 'width 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 72,
          px: collapsed ? 1 : 2.5,
          display: 'flex',
          alignItems: 'center',
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
          onClick={() => {
            setCollapsed(!collapsed);
            if (tempExpanded) setTempExpanded(false);
          }}
          size="small"
          sx={{
            color: '#94A3B8',
            borderRadius: 1.75,
            '&:hover': { bgcolor: alpha('#ffffff', 0.07) },
          }}
        >
          {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: alpha('#ffffff', 0.07), mx: 2.5 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2.5 }}>
        {navigation.map((group) => (
          <Box key={group.section} sx={{ mb: 3.5 }}>
            {!collapsed && (
              <Typography
                variant="overline"
                sx={{
                  px: 3,
                  mb: 1.2,
                  fontSize: '0.69rem',
                  fontWeight: 700,
                  letterSpacing: 0.9,
                  color: '#64748B',
                  display: 'block',
                }}
              >
                {group.section.toUpperCase()}
              </Typography>
            )}

            {renderNavItems(group.items)}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
