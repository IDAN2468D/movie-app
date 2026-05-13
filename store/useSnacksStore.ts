import { create } from 'zustand';

export interface SnackItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Popcorn' | 'Drinks' | 'Combos' | 'Candy';
}

interface SnacksState {
  items: SnackItem[];
  cart: { [id: string]: number };
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const SNACK_MENU: SnackItem[] = [
  {
    id: 'p1',
    name: 'XL Movie Popcorn',
    description: 'Freshly popped with premium butter',
    price: 35,
    image: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?q=80&w=400',
    category: 'Popcorn',
  },
  {
    id: 'p2',
    name: 'Caramel Popcorn',
    description: 'Sweet and crunchy delight',
    price: 38,
    image: 'https://images.unsplash.com/photo-1599508704512-2f19fe9191d8?q=80&w=400',
    category: 'Popcorn',
  },
  {
    id: 'd1',
    name: 'Classic Cola',
    description: 'Ice cold refreshing soda',
    price: 18,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400',
    category: 'Drinks',
  },
  {
    id: 'd2',
    name: 'Craft Orange Soda',
    description: 'Zesty and bubbly',
    price: 20,
    image: 'https://images.unsplash.com/photo-1554867017-67ad62649a21?q=80&w=400',
    category: 'Drinks',
  },
  {
    id: 'c1',
    name: 'Mega Combo',
    description: 'XL Popcorn + 2 Large Drinks + Candy',
    price: 65,
    image: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?q=80&w=400',
    category: 'Combos',
  },
  {
    id: 'c2',
    name: 'Date Night Combo',
    description: 'Large Popcorn + 2 Drinks',
    price: 55,
    image: 'https://images.unsplash.com/photo-1491466424936-e304919aada7?q=80&w=400',
    category: 'Combos',
  },
  {
    id: 'cn1',
    name: 'Gummy Bears',
    description: 'Sweet and chewy snacks',
    price: 15,
    image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?q=80&w=400',
    category: 'Candy',
  },
];

export const useSnacksStore = create<SnacksState>((set, get) => ({
  items: SNACK_MENU,
  cart: {},
  
  addItem: (id) => set((state) => ({
    cart: { ...state.cart, [id]: (state.cart[id] || 0) + 1 }
  })),
  
  removeItem: (id) => set((state) => {
    const newCart = { ...state.cart };
    if (newCart[id] > 1) {
      newCart[id] -= 1;
    } else {
      delete newCart[id];
    }
    return { cart: newCart };
  }),
  
  clearCart: () => set({ cart: {} }),
  
  getTotalPrice: () => {
    const { items, cart } = get();
    return Object.entries(cart).reduce((total, [id, quantity]) => {
      const item = items.find((i) => i.id === id);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  },
}));
