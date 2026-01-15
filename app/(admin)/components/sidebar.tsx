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
  Collapse,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import { navigation, NavItem } from '@/lib/navigation';

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Inventory: true,
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Recursive check if any child is active
  const checkIsActive = (item: NavItem): boolean => {
    if (item.path && pathname === item.path) return true;
    if (item.children)
      return item.children.some((child) => checkIsActive(child));
    return false;
  };

  const renderNavItems = (items: NavItem[], level = 0) => (
    <List
      disablePadding
      sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
    >
      {items.map((item) => {
        const hasChildren = !!item.children?.length;
        const isOpen = openSections[item.label] ?? false;
        const Icon = item.icon;

        const isActive = item.path ? pathname === item.path : false; // exact match
        const isActiveChild =
          !item.path && hasChildren
            ? item.children!.some((child) => checkIsActive(child))
            : false;

        // Collapsed mode tooltip for parent items
        if (collapsed && !item.path) {
          return (
            <Tooltip
              key={item.label}
              title={item.label}
              placement="right"
              arrow
            >
              <ListItemButton
                disabled
                sx={{
                  minHeight: 44,
                  borderRadius: 2,
                  px: 0,
                  justifyContent: 'center',
                  color: '#9CA3AF',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 'unset',
                    color: 'inherit',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 24 }} />
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
                onClick={() => {
                  if (hasChildren) toggleSection(item.label);
                  else if (item.path) router.push(item.path);
                }}
                sx={{
                  minHeight: 44,
                  borderRadius: 0,
                  px: collapsed ? 0 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  pl: level * 3 + 2,
                  bgcolor: isActive
                    ? '#1E40AF' // active leaf
                    : isActiveChild
                    ? 'rgba(59, 130, 246, 0.1)' // parent subtle highlight
                    : 'transparent',
                  color: isActive ? '#F9FAFB' : '#9CA3AF',
                  transition: 'all 0.2s',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: isActive ? '#1E40AF' : '#374151',
                    color: '#F9FAFB',
                    transform: 'translateX(2px)',
                  },
                  '&::before':
                    isActive && !collapsed
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          bgcolor: '#3B82F6',
                          borderRadius: 2,
                        }
                      : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'unset' : 40,
                    color: 'inherit',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 24 }} />
                </ListItemIcon>

                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 500,
                        noWrap: true,
                      }}
                    />
                    {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                  </>
                )}
              </ListItemButton>
            </Tooltip>

            {hasChildren && !collapsed && (
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
          overflowX: 'hidden',
          borderRight: '1px solid #374151',
          bgcolor: '#1F2937',
          color: '#F9FAFB',
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
        }}
      >
        {!collapsed && (
          <Box sx={{ pl: 1 }}>
            <img
              src="/greenage_logo.png"
              alt="GreenAge logo"
              style={{ width: '120px', height: 'auto' }}
            />
          </Box>
        )}

        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          size="small"
          sx={{
            color: '#9CA3AF',
            '&:hover': { color: '#3B82F6', bgcolor: 'transparent' },
          }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: '#374151' }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: collapsed ? 1.5 : 0 }}>
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
                  color: '#F9FAFB',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                }}
              >
                {group.section}
              </Typography>
            )}
            {renderNavItems(group.items)}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
