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
  snacks?: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
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
  cursors: Record<string, { userName: string; userId: string; x: number; y: number; expiresAt: number }>;
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
  sendCursorMove: (x: number, y: number) => void;
  sendSnacksSync: (snacks: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>) => void;
  leaveSquad: () => void;
  clearError: () => void;
}

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const useSquadBookingStore = create<SquadState>((set, get) => ({
  squadCode: null,
  sessionDetails: null,
  socket: null,
  hovers: {},
  cursors: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  createSquadSession: async (movieData) => {
    set({ isLoading: true, error: null });
    const authState = useAuthStore.getState();
    const token = authState.token || 'guest-squad-token-123';
    const currentUser = authState.user || {
      id: 'guest-user-1',
      name: 'משתמש אורח',
      email: 'guest@cinebook.app'
    };

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
      }
    } catch (err) {
      console.warn('[SquadStore] Remote squad server unavailable, switching to local offline squad session.');
    }

    // Local Fallback for Offline / Dev Mode
    const code = `SQD${Math.floor(100 + Math.random() * 900)}`;
    const mockSession: ISquadSession = {
      squadCode: code,
      movieId: movieData.movieId || 550,
      movieTitle: movieData.movieTitle || 'מועדון קרב (Fight Club)',
      moviePoster: movieData.moviePoster || '',
      date: movieData.date || 'היום, 21:30',
      showtimeId: movieData.showtimeId || 'st-1',
      showtimeTime: movieData.showtimeTime || '21:30',
      showtimeHall: movieData.showtimeHall || 'אולם IMAX 4',
      hostId: currentUser.id,
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          socketId: 'local-socket-1',
          joinedAt: new Date().toISOString()
        }
      ],
      lockedSeats: []
    };

    set({ squadCode: code, sessionDetails: mockSession, isLoading: false, error: null });
    return { success: true, code };
  },

  joinSquadSession: async (code) => {
    set({ isLoading: true, error: null });
    const cleanCode = code.toUpperCase().trim();
    const authState = useAuthStore.getState();
    const token = authState.token || 'guest-squad-token-123';
    const currentUser = authState.user || {
      id: 'guest-user-1',
      name: 'משתמש אורח',
      email: 'guest@cinebook.app'
    };

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
      }
    } catch (err) {
      console.warn('[SquadStore] Remote join unavailable, initializing local squad session.');
    }

    // Local Fallback for Offline / Dev Mode Join
    const mockSession: ISquadSession = {
      squadCode: cleanCode,
      movieId: 550,
      movieTitle: 'מועדון קרב (Fight Club)',
      moviePoster: '',
      date: 'היום, 21:30',
      showtimeId: 'st-1',
      showtimeTime: '21:30',
      showtimeHall: 'אולם IMAX 4',
      hostId: 'host-user-id',
      members: [
        {
          userId: 'host-user-id',
          name: 'מארח הקבוצה',
          email: 'host@cinebook.app',
          socketId: 'host-socket',
          joinedAt: new Date().toISOString()
        },
        {
          userId: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          socketId: 'local-socket-2',
          joinedAt: new Date().toISOString()
        }
      ],
      lockedSeats: [
        { row: 'C', number: 3, userId: 'host-user-id', lockedAt: new Date().toISOString() },
        { row: 'C', number: 4, userId: 'host-user-id', lockedAt: new Date().toISOString() }
      ]
    };

    set({ squadCode: cleanCode, sessionDetails: mockSession, isLoading: false, error: null });
    return { success: true };
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

    socket.on('cursor-update', ({ userId, userName, x, y }) => {
      set((state) => {
        const nextCursors = { ...state.cursors };
        nextCursors[userId] = {
          userName,
          userId,
          x,
          y,
          expiresAt: Date.now() + 4000 // Expire display after 4s
        };
        return { cursors: nextCursors };
      });
    });

    socket.on('seat-toggle-error', ({ message }) => {
      set({ error: message });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    set({ socket });

    // Clean up expired hovers & cursors periodically
    const interval = setInterval(() => {
      set((state) => {
        const now = Date.now();
        
        const nextHovers = { ...state.hovers };
        let hoversChanged = false;
        Object.entries(nextHovers).forEach(([key, val]) => {
          if (val.expiresAt < now) {
            delete nextHovers[key];
            hoversChanged = true;
          }
        });

        const nextCursors = { ...state.cursors };
        let cursorsChanged = false;
        Object.entries(nextCursors).forEach(([key, val]) => {
          if (val.expiresAt < now) {
            delete nextCursors[key];
            cursorsChanged = true;
          }
        });
        
        const updates: Partial<SquadState> = {};
        if (hoversChanged) updates.hovers = nextHovers;
        if (cursorsChanged) updates.cursors = nextCursors;
        
        return updates;
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
    const { socket, squadCode, sessionDetails } = get();
    const currentUser = useAuthStore.getState().user || { id: 'guest-user-1', name: 'משתמש אורח', email: 'guest@cinebook.app' };

    if (socket && socket.connected) {
      socket.emit('seat-toggle', {
        squadCode,
        userId: currentUser.id,
        row,
        number
      });
    } else if (sessionDetails) {
      const existingIndex = sessionDetails.lockedSeats.findIndex(s => s.row === row && s.number === number);
      let updatedSeats = [...sessionDetails.lockedSeats];
      if (existingIndex >= 0) {
        if (updatedSeats[existingIndex].userId === currentUser.id) {
          updatedSeats.splice(existingIndex, 1);
        }
      } else {
        updatedSeats.push({
          row,
          number,
          userId: currentUser.id,
          lockedAt: new Date().toISOString()
        });
      }
      set({
        sessionDetails: {
          ...sessionDetails,
          lockedSeats: updatedSeats
        }
      });
    }
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

  sendCursorMove: (x, y) => {
    const { socket, squadCode } = get();
    const user = useAuthStore.getState().user;
    if (!socket || !squadCode || !user) return;

    socket.emit('cursor-move', {
      squadCode,
      userId: user.id,
      userName: user.name,
      x,
      y
    });
  },

  sendSnacksSync: (snacks) => {
    const { socket, squadCode } = get();
    const user = useAuthStore.getState().user;
    if (!socket || !squadCode || !user) return;

    socket.emit('snack-update', {
      squadCode,
      userId: user.id,
      snacks
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
      cursors: {},
      error: null
    });
  }
}));
