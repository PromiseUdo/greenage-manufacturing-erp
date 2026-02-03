// lib/navigation.ts - UPDATED VERSION

import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import BadgeIcon from '@mui/icons-material/Badge';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HandymanIcon from '@mui/icons-material/Handyman';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Inventory2Icon from '@mui/icons-material/Inventory2';

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
    section: 'Sales',
    items: [
      {
        label: 'Products',
        icon: Inventory2Icon,
        path: '/products',
      },
      {
        label: 'Sales',
        icon: ShoppingCartIcon,
        children: [
          {
            label: 'Orders',
            path: '/sales/orders',
            icon: ShoppingCartIcon,
          },
          {
            label: 'Quotes',
            path: '/sales/quotes',
            icon: DescriptionIcon,
          },
          {
            label: 'Invoices',
            path: '/sales/invoices',
            icon: ReceiptIcon,
          },
        ],
      },
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
      {
        label: 'Customers',
        icon: StorefrontIcon,
        path: '/customers', // Direct path instead of children
      },
    ],
  },
];
