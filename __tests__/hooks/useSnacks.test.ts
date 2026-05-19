import { renderHook, act } from '@testing-library/react-native';
import { useSnacks } from '../../hooks/useSnacks';
import { useSnacksStore } from '../../store/useSnacksStore';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// Mock expo-haptics locally to include selectionAsync which is missing from global jest-setup
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 0,
    Medium: 1,
    Heavy: 2,
  },
  NotificationFeedbackType: {
    Success: 0,
    Warning: 1,
    Error: 2,
  },
}));

describe('useSnacks hook', () => {
  beforeEach(() => {
    useSnacksStore.getState().clearCart();
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSnacks());
    
    expect(result.current.activeCategory).toBe('All');
    expect(result.current.cart).toEqual({});
    expect(result.current.snacksTotal).toBe(0);
    expect(result.current.categories).toEqual(['All', 'Popcorn', 'Drinks', 'Combos', 'Candy']);
  });

  it('should allow setting category and trigger haptics', () => {
    const { result } = renderHook(() => useSnacks());
    
    act(() => {
      result.current.setCategory('Popcorn');
    });

    expect(result.current.activeCategory).toBe('Popcorn');
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it('should allow adding item and trigger haptics', () => {
    const { result } = renderHook(() => useSnacks());
    
    act(() => {
      result.current.addItem('p1');
    });

    expect(result.current.cart['p1']).toBe(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('should allow removing item and trigger haptics', () => {
    const { result } = renderHook(() => useSnacks());
    
    act(() => {
      result.current.addItem('p1');
      result.current.addItem('p1');
      result.current.removeItem('p1');
    });

    expect(result.current.cart['p1']).toBe(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('should allow clearing cart and trigger notification haptic', () => {
    const { result } = renderHook(() => useSnacks());
    
    act(() => {
      result.current.addItem('p1');
      result.current.clearCart();
    });

    expect(result.current.cart).toEqual({});
    expect(result.current.snacksTotal).toBe(0);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('should support navigating back', () => {
    const { result } = renderHook(() => useSnacks());
    
    act(() => {
      result.current.goBack();
    });

    expect(router.back).toHaveBeenCalled();
  });
});
