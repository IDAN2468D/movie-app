import { create } from 'zustand';

export type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface CineVisionState {
  hasPermission: boolean | null;
  flashMode: 'on' | 'off';
  scanState: ScanState;
  capturedImage: string | null;
  setHasPermission: (has: boolean | null) => void;
  setFlashMode: (mode: 'on' | 'off') => void;
  setScanState: (state: ScanState) => void;
  setCapturedImage: (uri: string | null) => void;
  reset: () => void;
}

export const useCineVisionStore = create<CineVisionState>((set) => ({
  hasPermission: null,
  flashMode: 'off',
  scanState: 'idle',
  capturedImage: null,
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setFlashMode: (flashMode) => set({ flashMode }),
  setScanState: (scanState) => set({ scanState }),
  setCapturedImage: (capturedImage) => set({ capturedImage }),
  reset: () => set({
    scanState: 'idle',
    capturedImage: null,
    flashMode: 'off',
  }),
}));

// Atomic selectors for performance optimization
export const selectHasPermission = (state: CineVisionState) => state.hasPermission;
export const selectFlashMode = (state: CineVisionState) => state.flashMode;
export const selectScanState = (state: CineVisionState) => state.scanState;
export const selectCapturedImage = (state: CineVisionState) => state.capturedImage;
export const selectSetHasPermission = (state: CineVisionState) => state.setHasPermission;
export const selectSetFlashMode = (state: CineVisionState) => state.setFlashMode;
export const selectSetScanState = (state: CineVisionState) => state.setScanState;
export const selectSetCapturedImage = (state: CineVisionState) => state.setCapturedImage;
export const selectResetCineVision = (state: CineVisionState) => state.reset;
