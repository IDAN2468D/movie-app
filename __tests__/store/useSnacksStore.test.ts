import { useSnacksStore } from '../../store/useSnacksStore';

describe('useSnacksStore', () => {
  beforeEach(() => {
    useSnacksStore.getState().clearCart();
  });

  it('should start with an empty cart', () => {
    const state = useSnacksStore.getState();
    expect(state.cart).toEqual({});
    expect(state.getTotalPrice()).toBe(0);
  });

  it('should add items to cart', () => {
    const { addItem } = useSnacksStore.getState();
    addItem('p1');
    addItem('p1');
    addItem('d1');

    const state = useSnacksStore.getState();
    expect(state.cart['p1']).toBe(2);
    expect(state.cart['d1']).toBe(1);
  });

  it('should remove items from cart', () => {
    const { addItem, removeItem } = useSnacksStore.getState();
    addItem('p1');
    addItem('p1');
    removeItem('p1');

    const state = useSnacksStore.getState();
    expect(state.cart['p1']).toBe(1);

    removeItem('p1');
    expect(useSnacksStore.getState().cart['p1']).toBeUndefined();
  });

  it('should calculate total price correctly', () => {
    const { addItem } = useSnacksStore.getState();
    // XL Popcorn (35) + Classic Cola (18)
    addItem('p1');
    addItem('d1');

    const state = useSnacksStore.getState();
    expect(state.getTotalPrice()).toBe(53);
  });

  it('should clear cart', () => {
    const { addItem, clearCart } = useSnacksStore.getState();
    addItem('p1');
    clearCart();

    const state = useSnacksStore.getState();
    expect(state.cart).toEqual({});
    expect(state.getTotalPrice()).toBe(0);
  });
});
