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
  isLoading: boolean;
  error: string | null;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  fetchSnacks: () => Promise<void>;
  submitOrder: () => Promise<{ success: boolean; orderId?: string }>;
}

const SERVER_URL = 'https://movie-app-server-olet.onrender.com';

const FALLBACK_SNACK_MENU: SnackItem[] = [
  {
    id: 'p1',
    name: 'פופקורן XL',
    description: 'פופקורן חם וטרי עם חמאה מלוחה',
    price: 35,
    image: require('../assets/images/snacks/xl-popcorn.png'),
    category: 'Popcorn',
  },
  {
    id: 'p2',
    name: 'פופקורן קרמל',
    description: 'השילוב המושלם של מתוק ומלוח',
    price: 38,
    image: require('../assets/images/snacks/caramel-popcorn.png'),
    category: 'Popcorn',
  },
  {
    id: 'd1',
    name: 'קולה קלאסי',
    description: 'מרענן וקר כקרח',
    price: 18,
    image: require('../assets/images/snacks/classic-cola.png'),
    category: 'Drinks',
  },
  {
    id: 'd2',
    name: 'סודה תפוזים',
    description: 'סודה תוססת בטעם פירותי',
    price: 20,
    image: require('../assets/images/snacks/orange-soda.png'),
    category: 'Drinks',
  },
  {
    id: 'c1',
    name: 'קומבו מגה',
    description: 'פופקורן XL + 2 שתייה גדולה + סוכריות',
    price: 65,
    image: require('../assets/images/snacks/mega-combo.png'),
    category: 'Combos',
  },
  {
    id: 'c2',
    name: 'קומבו דייט',
    description: 'פופקורן גדול + 2 שתייה',
    price: 55,
    image: require('../assets/images/snacks/date-night.png'),
    category: 'Combos',
  },
  {
    id: 'cn1',
    name: 'סוכריות גומי',
    description: 'נשנוש מתוק וכיפי לסרט',
    price: 15,
    image: require('../assets/images/snacks/gummy-bears.png'),
    category: 'Candy',
  },
];

export const useSnacksStore = create<SnacksState>((set, get) => ({
  items: FALLBACK_SNACK_MENU,
  cart: {},
  isLoading: false,
  error: null,
  
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

  fetchSnacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/api/snacks`);
      if (!response.ok) throw new Error('Failed to fetch snacks');
      const data = await response.json();
      
      const mergedItems = data.map((remoteItem: any) => {
        const localItem = FALLBACK_SNACK_MENU.find(i => i.id === remoteItem.id);
        return {
          ...remoteItem,
          image: localItem ? localItem.image : require('../assets/images/snacks/mega-combo.png'),
        };
      });
      
      set({ items: mergedItems.length > 0 ? mergedItems : FALLBACK_SNACK_MENU, isLoading: false });
    } catch (error) {
      console.log('Falling back to local snack menu due to server error:', error);
      set({ items: FALLBACK_SNACK_MENU, isLoading: false, error: 'Failed to load from server, using offline menu.' });
    }
  },

  submitOrder: async () => {
    const { cart, getTotalPrice, clearCart } = get();
    if (Object.keys(cart).length === 0) return { success: false };
    
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/api/snacks/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart, 
          total: getTotalPrice(),
          timestamp: Date.now()
        }),
      });
      
      if (!response.ok) {
        const status = response.status;
        const rawBodyText = await response.text();
        
        console.error(`🚨 [CineBook Snacks API] HTTP Status: ${status}`);
        console.error(`🚨 [CineBook Snacks API] Raw Response Body:`, rawBodyText);
        
        set({ isLoading: false, error: `שגיאת שרת (${status}): ההזמנה נכשלה` });
        return { success: false };
      }
      
      const data = await response.json();
      clearCart();
      set({ isLoading: false });
      return { success: true, orderId: data.orderId };
    } catch (error) {
      console.error(`🚨 [CineBook Snacks API] Fatal Exception:`, error);
      set({ isLoading: false, error: 'שגיאת רשת: לא ניתן להתחבר לשרת, אנא נסה שנית' });
      return { success: false };
    }
  }
}));
