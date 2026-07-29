import { create } from 'zustand';

export interface CarpoolRide {
  id: string;
  driverName: string;
  seatsAvailable: number;
  passengers: string[];
  pickupLocation: string;
  departureTime: string;
  costPerPerson: number;
  status: 'scheduled' | 'en_route' | 'arrived';
}

interface SquadTransitState {
  activeRide: CarpoolRide | null;
  isLoading: boolean;
  error: string | null;
  setActiveRide: (ride: CarpoolRide) => void;
  addPassenger: (passengerName: string) => void;
  createRide: (rideData: Omit<CarpoolRide, 'id' | 'passengers' | 'status'>) => void;
}

export const useSquadTransitStore = create<SquadTransitState>((set) => ({
  activeRide: {
    id: 'carpool-101',
    driverName: 'אופיר דהן',
    seatsAvailable: 4,
    passengers: ['דניאל', 'נועה'],
    pickupLocation: 'תחנת רכבת השלום, תל אביב',
    departureTime: '19:45',
    costPerPerson: 15,
    status: 'scheduled',
  },
  isLoading: false,
  error: null,
  setActiveRide: (ride) => set({ activeRide: ride }),
  addPassenger: (passengerName) =>
    set((state) => {
      if (!state.activeRide) return state;
      if (state.activeRide.passengers.length >= state.activeRide.seatsAvailable) return state;
      return {
        activeRide: {
          ...state.activeRide,
          passengers: [...state.activeRide.passengers, passengerName],
        },
      };
    }),
  createRide: (rideData) =>
    set({
      activeRide: {
        ...rideData,
        id: `carpool-${Date.now()}`,
        passengers: [],
        status: 'scheduled',
      },
    }),
}));
