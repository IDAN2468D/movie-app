import { useBookingStore } from '../../store/useBookingStore';

// Mock the API helper to avoid network calls
jest.mock('../../store/apiHelper', () => ({
  safeFetch: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

describe('useBookingStore', () => {
  beforeEach(() => {
    useBookingStore.getState().clearBooking();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Ensure no seats are "taken"
  });

  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('should initialize with default state', () => {
    const state = useBookingStore.getState();
    expect(state.selectedMovieId).toBeNull();
    expect(state.selectedSeats).toHaveLength(0);
    expect(state.totalPrice).toBe(0);
  });

  it('should select a movie correctly', () => {
    useBookingStore.getState().selectMovie(123, 'Inception', '/inception.jpg');
    const state = useBookingStore.getState();
    expect(state.selectedMovieId).toBe(123);
    expect(state.selectedMovieTitle).toBe('Inception');
    expect(state.selectedMoviePoster).toBe('/inception.jpg');
  });

  it('should generate seats correctly', () => {
    const rows = 5;
    const cols = 10;
    useBookingStore.getState().generateSeats(rows, cols);
    const state = useBookingStore.getState();
    
    expect(state.seats).toHaveLength(rows);
    expect(state.seats[0]).toHaveLength(cols);
    expect(state.selectedSeats).toHaveLength(0);
  });

  it('should toggle seat selection and calculate price', () => {
    // 1. Select movie and showtime first
    useBookingStore.getState().selectShowtime({
      id: '1',
      time: '20:00',
      format: 'Standard',
      price: 40,
      hall: 'Hall 1'
    });
    
    // 2. Generate seats (at least 3 rows so Row A index 0 is not VIP)
    useBookingStore.getState().generateSeats(4, 4);
    
    // 3. Toggle a standard seat (Row A, Seat 1)
    useBookingStore.getState().toggleSeat('A', 1);
    
    let state = useBookingStore.getState();
    expect(state.selectedSeats).toHaveLength(1);
    expect(state.totalPrice).toBe(40); // Standard price
    
    // 4. Toggle it again to deselect
    useBookingStore.getState().toggleSeat('A', 1);
    state = useBookingStore.getState();
    expect(state.selectedSeats).toHaveLength(0);
    expect(state.totalPrice).toBe(0);
  });

  it('should handle VIP seat pricing (1.5x)', () => {
    useBookingStore.getState().selectShowtime({
      id: '1',
      time: '20:00',
      format: 'Standard',
      price: 40,
      hall: 'Hall 1'
    });
    
    // In our generateSeats, r >= rows - 2 are VIP.
    // Let's make 4 rows, so row 2 and 3 (C, D) are VIP.
    useBookingStore.getState().generateSeats(4, 4);
    
    // Toggle a VIP seat (Row C is index 2)
    useBookingStore.getState().toggleSeat('C', 1);
    
    const state = useBookingStore.getState();
    expect(state.selectedSeats[0].type).toBe('vip');
    expect(state.totalPrice).toBe(40 * 1.5); // 60
  });

  it('should clear booking state correctly', () => {
    useBookingStore.getState().selectMovie(1, 'Title', 'Poster');
    useBookingStore.getState().clearBooking();
    
    const state = useBookingStore.getState();
    expect(state.selectedMovieId).toBeNull();
    expect(state.selectedMovieTitle).toBe('');
  });
});
