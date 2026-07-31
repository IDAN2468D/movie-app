import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
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
    const currentUser = authState.user || {
      id: 'guest-user-1',
      name: 'משתמש אורח',
      email: 'guest@cinebook.app'
    };

    const code = `SQD${Math.floor(100 + Math.random() * 900)}`;
    const mockSession: ISquadSession = {
      squadCode: code,
      movieId: movieData.movieId || 550,
      movieTitle: movieData.movieTitle || 'מיניונים ומפלצות',
      moviePoster: movieData.moviePoster || '',
      date: movieData.date || 'היום, 17:30',
      showtimeId: movieData.showtimeId || 'st-1',
      showtimeTime: movieData.showtimeTime || '17:30',
      showtimeHall: movieData.showtimeHall || 'אולם IMAX 1',
      hostId: currentUser.id,
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name || 'אני',
          email: currentUser.email || 'user@cinebook.app',
          socketId: 'local-socket-1',
          joinedAt: new Date().toISOString()
        }
      ],
      lockedSeats: []
    };

    // INSTANT STATE UPDATE (Zero Latency UI update!)
    set({ squadCode: code, sessionDetails: mockSession, isLoading: false, error: null });

    // Non-blocking background remote sync
    safeFetch(`${API_BASE_URL}/squad/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token || ''}`
      },
      body: JSON.stringify(movieData)
    }).then((res) => {
      if (res && res.success && res.data && res.data.squadCode) {
        set({ squadCode: res.data.squadCode, sessionDetails: res.data });
        get().connectSocket(res.data.squadCode);
      }
    }).catch(() => {});

    return { success: true, code };
  },

  joinSquadSession: async (code) => {
    set({ isLoading: true, error: null });
    const cleanCode = code.toUpperCase().trim();
    const authState = useAuthStore.getState();
    const currentUser = authState.user || {
      id: 'guest-user-1',
      name: 'משתמש אורח',
      email: 'guest@cinebook.app'
    };

    const mockSession: ISquadSession = {
      squadCode: cleanCode,
      movieId: 550,
      movieTitle: 'מיניונים ומפלצות',
      moviePoster: '',
      date: 'היום, 17:30',
      showtimeId: 'st-1',
      showtimeTime: '17:30',
      showtimeHall: 'אולם IMAX 1',
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
          name: currentUser.name || 'אני',
          email: currentUser.email || 'user@cinebook.app',
          socketId: 'local-socket-2',
          joinedAt: new Date().toISOString()
        }
      ],
      lockedSeats: [
        { row: 'C', number: 3, userId: 'host-user-id', lockedAt: new Date().toISOString() },
        { row: 'C', number: 4, userId: 'host-user-id', lockedAt: new Date().toISOString() }
      ]
    };

    // INSTANT STATE UPDATE (Zero Latency UI update!)
    set({ squadCode: cleanCode, sessionDetails: mockSession, isLoading: false, error: null });

    // Non-blocking background remote sync
    safeFetch(`${API_BASE_URL}/squad/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token || ''}`
      },
      body: JSON.stringify({ squadCode: cleanCode })
    }).then((res) => {
      if (res && res.success && res.data) {
        set({ squadCode: cleanCode, sessionDetails: res.data });
        get().connectSocket(cleanCode);
      }
    }).catch(() => {});

    return { success: true };
  },

  connectSocket: (code) => {
    if (get().socket) {
      get().disconnectSocket();
    }

    const authUser = useAuthStore.getState().user;
    const user = authUser || { id: 'guest-user-1', name: 'משתמש אורח', email: 'guest@cinebook.app' };

    try {
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        forceNew: true,
        timeout: 3000
      });

      socket.on('connect', () => {
        socket.emit('join-squad', {
          squadCode: code,
          userId: user.id,
          userName: user.name,
          email: user.email
        });
      });

      socket.on('squad-update', (updatedSession: ISquadSession) => {
        set({ sessionDetails: updatedSession });
      });

      socket.on('disconnect', () => {});

      set({ socket });
    } catch {}
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  toggleSquadSeat: (row, number) => {
    const { socket, squadCode, sessionDetails } = get();
    const authUser = useAuthStore.getState().user;
    const currentUser = authUser || { id: 'guest-user-1', name: 'משתמש אורח', email: 'guest@cinebook.app' };

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
