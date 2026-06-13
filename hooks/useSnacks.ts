/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBookingStore } from '@/store/useBookingStore';
import { useSnacksStore } from '@/store/useSnacksStore';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';

export type SnackCategory = 'All' | 'Popcorn' | 'Drinks' | 'Combos' | 'Candy';

export const useSnacks = () => {
  const selectedMoviePoster = useBookingStore(state => state.selectedMoviePoster);
  const ticketsTotal = useBookingStore(state => state.totalPrice);
  const { items, cart, addItem: addItemToStore, removeItem: removeItemFromStore, getTotalPrice, clearCart: clearCartStore } = useSnacksStore();
  
  const [activeCategory, setActiveCategory] = useState<SnackCategory>('All');
  
  const categories: SnackCategory[] = ['All', 'Popcorn', 'Drinks', 'Combos', 'Candy'];
  
  const filteredItems = useMemo(() => {
    return activeCategory === 'All' 
      ? items 
      : items.filter(item => item.category === activeCategory);
  }, [items, activeCategory]);

  const snacksTotal = getTotalPrice();

  // Helper to sync the tray items with the CineCrew co-booking session
  const syncSquadSnacks = (updatedCart: Record<string, number>) => {
    const squadCode = useSquadBookingStore.getState().squadCode;
    if (squadCode) {
      const syncList = Object.entries(updatedCart).map(([id, qty]) => {
        const item = items.find(i => i.id === id);
        return {
          id,
          name: item?.name || 'נשנוש',
          price: item?.price || 0,
          quantity: qty,
          image: item?.image ? String(item.image) : undefined
        };
      });
      useSquadBookingStore.getState().sendSnacksSync(syncList);
    }
  };

  const handleCheckout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/movie/checkout' as any);
  }, [router]);

  const setCategory = useCallback((category: SnackCategory) => {
    Haptics.selectionAsync();
    setActiveCategory(category);
  }, []);

  const addItem = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItemToStore(id);
    
    // Sync to CineCrew lobby after state mutation completes
    setTimeout(() => {
      const nextCart = useSnacksStore.getState().cart;
      syncSquadSnacks(nextCart);
    }, 0);
  }, [addItemToStore, items]);

  const removeItem = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeItemFromStore(id);
    
    setTimeout(() => {
      const nextCart = useSnacksStore.getState().cart;
      syncSquadSnacks(nextCart);
    }, 0);
  }, [removeItemFromStore, items]);

  const clearCart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearCartStore();
    
    setTimeout(() => {
      syncSquadSnacks({});
    }, 0);
  }, [clearCartStore]);

  const goBack = () => {
    router.back();
  };

  return {
    selectedMoviePoster,
    ticketsTotal,
    items: filteredItems,
    cart,
    activeCategory,
    categories,
    snacksTotal,
    handleCheckout,
    setCategory,
    addItem,
    removeItem,
    clearCart,
    goBack,
  };
};
