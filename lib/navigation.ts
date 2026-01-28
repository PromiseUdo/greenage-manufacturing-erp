// lib/navigation.ts - UPDATED VERSION

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import HandymanIcon from '@mui/icons-material/Handyman';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { SvgIconProps } from '@mui/material';

export interface NavItem {
  label: string;
  path?: string;
  icon: React.ComponentType<SvgIconProps>;
  children?: NavItem[];
}

export const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }],
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
    ],
  },
  {
    section: 'Administration',
    items: [
      {
        label: 'Staff',
        icon: BadgeIcon,
        children: [
          {
            label: 'Employees',
            path: '/staff/employees',
            icon: PeopleIcon,
          },
        ],
      },
      // {
      //   label: 'Customers',
      //   icon: StorefrontIcon,
      //   children: [
      //     {
      //       label: 'Customer List',
      //       path: '/customers',
      //       icon: PeopleIcon,
      //     },
      //     {
      //       label: 'Portal Accounts',
      //       path: '/staff/customer-accounts',
      //       icon: AccountCircleIcon,
      //     },
      //   ],
      // },
    ],
  },
];
