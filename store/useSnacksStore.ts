import { create } from 'zustand';

export interface SnackItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: any;
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
    image: require('../assets/images/snacks/xl-popcorn.png'),
    category: 'Popcorn',
  },
  {
    id: 'p2',
    name: 'Caramel Popcorn',
    description: 'Sweet and crunchy delight',
    price: 38,
    image: require('../assets/images/snacks/caramel-popcorn.png'),
    category: 'Popcorn',
  },
  {
    id: 'd1',
    name: 'Classic Cola',
    description: 'Ice cold refreshing soda',
    price: 18,
    image: require('../assets/images/snacks/classic-cola.png'),
    category: 'Drinks',
  },
  {
    id: 'd2',
    name: 'Craft Orange Soda',
    description: 'Zesty and bubbly',
    price: 20,
    image: require('../assets/images/snacks/orange-soda.png'),
    category: 'Drinks',
  },
  {
    id: 'c1',
    name: 'Mega Combo',
    description: 'XL Popcorn + 2 Large Drinks + Candy',
    price: 65,
    image: require('../assets/images/snacks/mega-combo.png'),
    category: 'Combos',
  },
  {
    id: 'c2',
    name: 'Date Night Combo',
    description: 'Large Popcorn + 2 Drinks',
    price: 55,
    image: require('../assets/images/snacks/date-night.png'),
    category: 'Combos',
  },
  {
    id: 'cn1',
    name: 'Gummy Bears',
    description: 'Sweet and chewy snacks',
    price: 15,
    image: require('../assets/images/snacks/gummy-bears.png'),
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
