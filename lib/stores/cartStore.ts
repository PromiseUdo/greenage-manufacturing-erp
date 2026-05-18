import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  storeItemId: string;
  itemName: string;
  itemNumber: string;
  category: string;
  primaryImage: string | null;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (storeItemId: string, quantity: number) => void;
  removeItem: (storeItemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.storeItemId === item.storeItemId);
          if (existing) {
            const newQty = Math.min(
              existing.quantity + quantity,
              item.availableStock,
            );
            return {
              items: state.items.map((i) =>
                i.storeItemId === item.storeItemId ? { ...i, quantity: newQty } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.availableStock) }],
            isOpen: true,
          };
        });
      },

      updateQuantity: (storeItemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(storeItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.storeItemId !== storeItemId) return i;
            return { ...i, quantity: Math.min(quantity, i.availableStock) };
          }),
        }));
      },

      removeItem: (storeItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.storeItemId !== storeItemId),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    {
      name: 'greenage-customer-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
