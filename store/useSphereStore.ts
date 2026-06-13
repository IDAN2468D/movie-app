import { create } from 'zustand';

interface SphereState {
  activeMovieId: number | null;
  rotationX: number; // Pitch
  rotationY: number; // Yaw
  zoom: number;      // Zoom scale factor

  setActiveMovieId: (id: number | null) => void;
  setRotation: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  resetState: () => void;
}

export const useSphereStore = create<SphereState>((set) => ({
  activeMovieId: null,
  rotationX: 0,
  rotationY: 0,
  zoom: 1,

  setActiveMovieId: (id) => set({ activeMovieId: id }),
  setRotation: (x, y) => set({ rotationX: x, rotationY: y }),
  setZoom: (zoom) => set({ zoom }),
  resetState: () => set({ activeMovieId: null, rotationX: 0, rotationY: 0, zoom: 1 }),
}));

// Strict selectors for optimized rendering
export const useSphereActiveMovieId = () => useSphereStore((state) => state.activeMovieId);
export const useSphereRotationX = () => useSphereStore((state) => state.rotationX);
export const useSphereRotationY = () => useSphereStore((state) => state.rotationY);
export const useSphereZoom = () => useSphereStore((state) => state.zoom);
export const useSphereActions = () => {
  const setActiveMovieId = useSphereStore((state) => state.setActiveMovieId);
  const setRotation = useSphereStore((state) => state.setRotation);
  const setZoom = useSphereStore((state) => state.setZoom);
  const resetState = useSphereStore((state) => state.resetState);
  return { setActiveMovieId, setRotation, setZoom, resetState };
};
