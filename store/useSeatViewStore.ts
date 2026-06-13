import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { API_BASE_URL } from '@/constants/Config';

interface Coords3D {
  x: number;
  y: number;
  z: number;
}

interface SeatViewStore {
  activeRow: string | null;
  activeNumber: number | null;
  activeViewCoords: Coords3D | null;
  isHUDExpanded: boolean;
  soundDb: number;
  isLoading: boolean;
  error: string | null;
  
  fetchSeatMetadata: (hallId: string, row: string, number: number) => Promise<void>;
  toggleHUD: (expanded: boolean) => void;
  clearSeatView: () => void;
}

export const useSeatViewStore = create<SeatViewStore>((set) => ({
  activeRow: null,
  activeNumber: null,
  activeViewCoords: null,
  isHUDExpanded: false,
  soundDb: 85,
  isLoading: false,
  error: null,

  fetchSeatMetadata: async (hallId, row, number) => {
    set({ isLoading: true, error: null, activeRow: row, activeNumber: number });
    try {
      const response = await safeFetch(
        `${API_BASE_URL}/cinema/seat-view/${hallId}?row=${row}&number=${number}`
      );

      if (response.success && response.data) {
        set({
          activeViewCoords: response.data.coords3D,
          soundDb: response.data.soundLevel || 85,
          isHUDExpanded: true,
          isLoading: false,
        });
      } else {
        // Safe offline local fallback calculation if API fails
        const rowVal = row.charCodeAt(0) - 65; // A=0, B=1, ...
        const normalizedX = (number - 6) / 6; // Assume 12 seats per row, maps middle to 0
        const normalizedY = 0.2 + (rowVal * 0.1); // Row A is close, Row H is far
        const normalizedZ = 1.0 + (rowVal * 0.05); // Elevation increases slightly towards back

        set({
          activeViewCoords: { x: normalizedX, y: normalizedY, z: normalizedZ },
          soundDb: Math.round(85 - Math.abs(normalizedX) * 5 - (normalizedY * 8)), // Lower sound on sides and back
          isHUDExpanded: true,
          isLoading: false,
        });
      }
    } catch (err) {
      // Offline fallback
      const rowVal = row.charCodeAt(0) - 65;
      const normalizedX = (number - 6) / 6;
      const normalizedY = 0.2 + (rowVal * 0.1);
      const normalizedZ = 1.0 + (rowVal * 0.05);

      set({
        activeViewCoords: { x: normalizedX, y: normalizedY, z: normalizedZ },
        soundDb: Math.round(85 - Math.abs(normalizedX) * 5 - (normalizedY * 8)),
        isHUDExpanded: true,
        isLoading: false,
      });
    }
  },

  toggleHUD: (expanded) => set({ isHUDExpanded: expanded }),
  
  clearSeatView: () => set({ 
    activeRow: null, 
    activeNumber: null, 
    activeViewCoords: null, 
    isHUDExpanded: false 
  }),
}));
