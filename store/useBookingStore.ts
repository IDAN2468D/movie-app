/**
 * Booking Store (Zustand)
 * Manages movie selection, showtime, and seat booking state.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from '@/utils/SafeModules';
import { API_BASE_URL } from '@/constants/Config';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { z } from 'zod';
import { ServerTicketSchema } from '@/lib/apiSchemas';

export interface Showtime {
  id: string;
  time: string;
  format: 'Standard' | 'IMAX' | '4DX' | 'VIP' | 'רגיל';
  price: number;
  hall: string;
}

export interface Seat {
  row: string;
  number: number;
  type: 'standard' | 'vip' | 'disabled';
  status: 'available' | 'taken' | 'selected';
}

interface BookingState {
  // Selected movie
  selectedMovieId: number | null;
  selectedMovieTitle: string;
  selectedMoviePoster: string;

  // Showtime
  selectedDate: string;
  selectedShowtime: Showtime | null;

  // Seats
  seats: Seat[][];
  selectedSeats: Seat[];
  totalPrice: number;

  // Tickets
  myTickets: BookedTicket[];

  // Actions
  selectMovie: (id: number, title: string, poster: string) => void;
  selectDate: (date: string) => void;
  selectShowtime: (showtime: Showtime) => void;
  toggleSeat: (row: string, number: number) => void;
  selectSeatCluster: (seatsToSelect: { row: string; number: number }[]) => void;
  bookCurrentSelection: (snacks?: SnackBookingItem[]) => Promise<void>;
  clearBooking: () => void;
  generateSeats: (rows: number, cols: number) => void;
  fetchMyTickets: () => Promise<void>;
}

export interface SnackBookingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface BookedTicket {
  id: string;
  movieId: number;
  movieTitle: string;
  date: string;
  showtime: Showtime;
  seats: Seat[];
  snacks?: SnackBookingItem[];
  totalPrice: number;
  bookingDate: string;
}

const ROW_LABELS = 'ABCDEFGHIJKLMNOP'.split('');

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
  selectedMovieId: null,
  selectedMovieTitle: '',
  selectedMoviePoster: '',
  selectedDate: '',
  selectedShowtime: null,
  seats: [],
  selectedSeats: [],
  totalPrice: 0,
  myTickets: [],

  selectMovie: (id, title, poster) => {
    const state = get();
    if (state.selectedMovieId === id) return;
    set({ 
      selectedMovieId: id, 
      selectedMovieTitle: title,
      selectedMoviePoster: poster,
      selectedShowtime: null, 
      selectedSeats: [], 
      totalPrice: 0 
    });
  },

  selectDate: (date) => {
    const state = get();
    if (state.selectedDate === date) return;
    set({ selectedDate: date, selectedShowtime: null });
  },

  selectShowtime: (showtime) => {
    const state = get();
    if (state.selectedShowtime?.id === showtime.id) return;
    set({ selectedShowtime: showtime, selectedSeats: [], totalPrice: 0 });
  },

  generateSeats: (rows, cols) => {
    const generated: Seat[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Seat[] = [];
      for (let c = 1; c <= cols; c++) {
        const isTaken = Math.random() < 0.3; // 30% chance taken
        const isVIP = r >= rows - 2; // last 2 rows are VIP
        row.push({
          row: ROW_LABELS[r],
          number: c,
          type: isVIP ? 'vip' : 'standard',
          status: isTaken ? 'taken' : 'available',
        });
      }
      generated.push(row);
    }
    set({ seats: generated, selectedSeats: [] });
  },

  toggleSeat: (row, number) => {
    const { seats, selectedShowtime } = get();
    if (!selectedShowtime) return;

    const updated = seats.map((seatRow) =>
      seatRow.map((seat) => {
        if (seat.row === row && seat.number === number && seat.status !== 'taken') {
          return {
            ...seat,
            status: seat.status === 'selected' ? 'available' as const : 'selected' as const,
          };
        }
        return seat;
      })
    );

    const selected = updated.flat().filter((s) => s.status === 'selected');
    const price = selected.reduce((sum, s) => {
      const base = selectedShowtime.price;
      return sum + (s.type === 'vip' ? base * 1.5 : base);
    }, 0);

    set({ seats: updated, selectedSeats: selected, totalPrice: price });
  },

  selectSeatCluster: (seatsToSelect) => {
    const { seats, selectedShowtime } = get();
    if (!selectedShowtime) return;

    const keysToSelect = new Set(seatsToSelect.map(s => `${s.row}-${s.number}`));

    const updated = seats.map((seatRow) =>
      seatRow.map((seat) => {
        if (seat.status === 'taken') return seat;
        
        const isTarget = keysToSelect.has(`${seat.row}-${seat.number}`);
        return {
          ...seat,
          status: isTarget ? ('selected' as const) : ('available' as const),
        };
      })
    );

    const selected = updated.flat().filter((s) => s.status === 'selected');
    const price = selected.reduce((sum, s) => {
      const base = selectedShowtime.price;
      return sum + (s.type === 'vip' ? base * 1.5 : base);
    }, 0);

    set({ seats: updated, selectedSeats: selected, totalPrice: price });
  },

  bookCurrentSelection: async (snacks) => {
    const { selectedMovieId, selectedMovieTitle, selectedDate, selectedShowtime, selectedSeats, totalPrice } = get();
    if (!selectedMovieId || !selectedShowtime || selectedSeats.length === 0) return;

    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const result = await safeFetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: selectedMovieId,
          movieTitle: selectedMovieTitle,
          date: selectedDate,
          showtime: selectedShowtime,
          seats: selectedSeats,
          snacks: snacks || [],
          totalPrice
        }),
      });
      
      if (result.success) {
        const validatedTicket = ServerTicketSchema.safeParse(result.data);
        const ticketToUse = validatedTicket.success ? validatedTicket.data : result.data;
        
        set((state) => ({
          myTickets: [ticketToUse as any, ...state.myTickets],
        }));
        try {
          await useAuthStore.getState().checkAuth();
        } catch (e) {
          console.error('Failed to sync user profile:', e);
        }
      } else {
        console.error('Failed to book ticket:', result.message);
      }
    } catch (error) {
      console.error('Error booking ticket:', error);
    }
  },

  fetchMyTickets: async () => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) return;

      const result = await safeFetch(`${API_BASE_URL}/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (result.success) {
        const ticketListSchema = z.array(ServerTicketSchema);
        const validatedTickets = ticketListSchema.safeParse(result.data);
        const ticketsToUse = validatedTickets.success ? validatedTickets.data : result.data;
        
        set({ myTickets: ticketsToUse as any[] });
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  },

  clearBooking: () =>
    set({
      selectedMovieId: null,
      selectedMovieTitle: '',
      selectedMoviePoster: '',
      selectedDate: '',
      selectedShowtime: null,
      seats: [],
      selectedSeats: [],
      totalPrice: 0,
    }),
    }),
    {
      name: 'cinebook-booking',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        myTickets: state.myTickets,
      }),
    }
  )
);
