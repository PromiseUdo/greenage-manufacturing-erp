// lib/navigation.ts
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
export const navigation = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
      { label: 'Orders', path: '/orders', icon: ShoppingCartIcon },
    ],
  },
  {
    section: 'Management',
    items: [
      // { label: 'Customers', path: '/customers', icon: PeopleIcon },
      { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
    ],
  },
];
