// // lib/navigation.ts
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import PeopleIcon from '@mui/icons-material/People';
// import InventoryIcon from '@mui/icons-material/Inventory';
// export const navigation = [
//   {
//     section: 'Main',
//     items: [
//       { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
//       { label: 'Orders', path: '/orders', icon: ShoppingCartIcon },
//     ],
//   },
//   {
//     section: 'Management',
//     items: [
//       { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
//     ],
//   },
// ];

// lib/navigation.ts
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category'; // optional – for sub-items
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { SvgIconProps } from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';
export interface NavItem {
  label: string;
  path?: string; // optional – only leaf nodes have path
  icon: React.ComponentType<SvgIconProps>;
  children?: NavItem[]; // for nested items
}

export const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
      // { label: 'Orders', path: '/orders', icon: ShoppingCartIcon },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        label: 'Inventory',
        icon: InventoryIcon,

        children: [
          { label: 'Overview', path: '/inventory', icon: DashboardIcon },

          {
            label: 'Materials',
            path: '/inventory/materials',
            icon: CategoryIcon,
          },
          {
            label: 'Tools',
            path: '/inventory/tools',
            icon: HandymanIcon,
          },
          {
            label: 'Suppliers',
            path: '/inventory/suppliers',
            icon: PeopleIcon,
          },
          {
            label: 'Issuance',
            path: '/inventory/issuance',
            icon: AssignmentReturnIcon,
          },
          { label: 'GRN', path: '/inventory/grn', icon: LocalShippingIcon },
        ],
      },
      // ... you can add more top-level items here later
    ],
  },
];
