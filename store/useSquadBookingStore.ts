import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { useBookingStore } from './useBookingStore';
import { API_BASE_URL } from '@/constants/Config';

export interface ISquadMember {
  userId: string;
  name: string;
  email: string;
  socketId?: string;
  joinedAt: string;
}

export interface ISquadSeat {
  row: string;
  number: number;
  userId: string;
  lockedAt: string;
}

export interface ISquadSession {
  squadCode: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  date: string;
  showtimeId: string;
  showtimeTime: string;
  showtimeHall: string;
  hostId: string;
  members: ISquadMember[];
  lockedSeats: ISquadSeat[];
}

interface SquadState {
  squadCode: string | null;
  sessionDetails: ISquadSession | null;
  socket: Socket | null;
  hovers: Record<string, { userName: string; userId: string; row: string; number: number; expiresAt: number }>;
  isLoading: boolean;
  error: string | null;

  createSquadSession: (movieData: {
    movieId: number;
    movieTitle: string;
    moviePoster: string;
    date: string;
    showtimeId: string;
    showtimeTime: string;
    showtimeHall: string;
  }) => Promise<{ success: boolean; code?: string; message?: string }>;
  
  joinSquadSession: (squadCode: string) => Promise<{ success: boolean; message?: string }>;
  connectSocket: (code: string) => void;
  disconnectSocket: () => void;
  toggleSquadSeat: (row: string, number: number) => void;
  sendSeatHover: (row: string, number: number, isHovering: boolean) => void;
  leaveSquad: () => void;
  clearError: () => void;
}

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const useSquadBookingStore = create<SquadState>((set, get) => ({
  squadCode: null,
  sessionDetails: null,
  socket: null,
  hovers: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  createSquadSession: async (movieData) => {
    set({ isLoading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoading: false, error: 'אנא התחבר תחילה' });
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const result = await safeFetch(`${API_BASE_URL}/squad/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(movieData)
      });

      if (result.success && result.data) {
        const code = result.data.squadCode;
        set({ squadCode: code, sessionDetails: result.data, isLoading: false });
        get().connectSocket(code);
        return { success: true, code };
      } else {
        set({ error: result.message || 'שגיאה ביצירת קבוצה', isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (err) {
      set({ error: 'שגיאת רשת ביצירת קבוצה', isLoading: false });
      return { success: false, message: 'Network error' };
    }
  },

  joinSquadSession: async (code) => {
    set({ isLoading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoading: false, error: 'אנא התחבר תחילה' });
      return { success: false, message: 'Not authenticated' };
    }

    const cleanCode = code.toUpperCase().trim();

    try {
      const result = await safeFetch(`${API_BASE_URL}/squad/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ squadCode: cleanCode })
      });

      if (result.success && result.data) {
        set({ squadCode: cleanCode, sessionDetails: result.data, isLoading: false });
        get().connectSocket(cleanCode);
        return { success: true };
      } else {
        set({ error: result.message || 'קוד קבוצה שגוי או פג תוקף', isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (err) {
      set({ error: 'שגיאת רשת בחיבור לקבוצה', isLoading: false });
      return { success: false, message: 'Network error' };
    }
  },

  connectSocket: (code) => {
    // Prevent duplicate connections
    if (get().socket) {
      get().disconnectSocket();
    }

    const user = useAuthStore.getState().user;
    if (!user) return;

    console.log(`🔌 Connecting to socket server: ${SOCKET_URL}`);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log(`✅ Socket connected successfully: ${socket.id}`);
      socket.emit('join-squad', {
        squadCode: code,
        userId: user.id,
        userName: user.name,
        email: user.email
      });
    });

    socket.on('squad-update', (updatedSession: ISquadSession) => {
      console.log('👥 Squad updated:', JSON.stringify(updatedSession.lockedSeats));
      set({ sessionDetails: updatedSession });

      // Synchronize with local useBookingStore selected seats
      const myLockedSeats = updatedSession.lockedSeats
        .filter(s => s.userId === user.id)
        .map(s => {
          const localSeats = useBookingStore.getState().seats;
          const foundLocal = localSeats.flat().find(ls => ls.row === s.row && ls.number === s.number);
          return {
            row: s.row,
            number: s.number,
            type: foundLocal?.type || 'standard',
            status: 'selected' as const
          };
        });

      useBookingStore.getState().selectSeatCluster(myLockedSeats);
    });

    socket.on('seat-hover-broadcast', ({ userId, userName, row, number, isHovering }) => {
      const hoverKey = `${row}-${number}`;
      set((state) => {
        const nextHovers = { ...state.hovers };
        if (isHovering) {
          nextHovers[hoverKey] = {
            userName,
            userId,
            row,
            number,
            expiresAt: Date.now() + 3000 // Expire hover display after 3s
          };
        } else {
          // Remove if user stopped hovering this seat
          if (nextHovers[hoverKey]?.userId === userId) {
            delete nextHovers[hoverKey];
          }
        }
        return { hovers: nextHovers };
      });
    });

    socket.on('seat-toggle-error', ({ message }) => {
      set({ error: message });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    set({ socket });

    // Clean up expired hovers periodically
    const interval = setInterval(() => {
      set((state) => {
        const now = Date.now();
        const nextHovers = { ...state.hovers };
        let changed = false;
        
        Object.entries(nextHovers).forEach(([key, val]) => {
          if (val.expiresAt < now) {
            delete nextHovers[key];
            changed = true;
          }
        });
        
        return changed ? { hovers: nextHovers } : {};
      });
    }, 1000);

    // Attach interval to socket object for clearing
    (socket as any)._hoverInterval = interval;
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      if ((socket as any)._hoverInterval) {
        clearInterval((socket as any)._hoverInterval);
      }
      socket.disconnect();
      set({ socket: null });
    }
  },

  toggleSquadSeat: (row, number) => {
    const { socket, squadCode } = get();
    const user = useAuthStore.getState().user;
    if (!socket || !squadCode || !user) return;

    socket.emit('seat-toggle', {
      squadCode,
      userId: user.id,
      row,
      number
    });
  },

  sendSeatHover: (row, number, isHovering) => {
    const { socket, squadCode } = get();
    const user = useAuthStore.getState().user;
    if (!socket || !squadCode || !user) return;

    socket.emit('seat-hover', {
      squadCode,
      userId: user.id,
      userName: user.name,
      row,
      number,
      isHovering
    });
  },

  leaveSquad: () => {
    const { socket, squadCode } = get();
    const user = useAuthStore.getState().user;
    
    if (socket && squadCode && user) {
      socket.emit('leave-squad', {
        squadCode,
        userId: user.id
      });
    }

    get().disconnectSocket();
    set({
      squadCode: null,
      sessionDetails: null,
      hovers: {},
      error: null
    });
  }
}));
