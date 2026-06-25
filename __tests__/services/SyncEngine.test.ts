import { SyncEngine, SyncEvent } from '../../services/SyncEngine';

// Mock the haptics service to avoid triggering hardware haptics in test runner
jest.mock('../../services/HapticsService', () => ({
  __esModule: true,
  hapticsService: {
    trigger: jest.fn(),
  },
  default: {
    trigger: jest.fn(),
  }
}));

describe('SyncEngine', () => {
  let mockTimeline: SyncEvent[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTimeline = [
      { timeMs: 2000, type: 'light' },
      { timeMs: 1000, type: 'heavy' },
      { timeMs: 3000, type: 'medium' },
    ];
  });

  it('should sort the timeline by timestamp upon initialization', () => {
    const engine = new SyncEngine(mockTimeline);
    const timeline = (engine as any).timeline;
    expect(timeline[0].timeMs).toBe(1000);
    expect(timeline[1].timeMs).toBe(2000);
    expect(timeline[2].timeMs).toBe(3000);
  });

  it('should trigger events in chronological order', () => {
    const engine = new SyncEngine(mockTimeline);
    const callback = jest.fn();
    engine.registerCallback(callback);

    // Initial check at 0ms - no triggers
    engine.checkEvents(0);
    expect(callback).not.toHaveBeenCalled();

    // Check at 1500ms - should trigger 1000ms (heavy)
    engine.checkEvents(1500);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ timeMs: 1000, type: 'heavy' }));

    // Check at 3500ms - should trigger 2000ms (light) and 3000ms (medium)
    engine.checkEvents(3500);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ timeMs: 3000, type: 'medium' }));
  });

  it('should reset triggered states and index when reset is called', () => {
    const engine = new SyncEngine(mockTimeline);
    const callback = jest.fn();
    engine.registerCallback(callback);

    engine.checkEvents(3500);
    expect(callback).toHaveBeenCalledTimes(3);

    engine.reset();
    expect((engine as any).currentIndex).toBe(0);
    expect((engine as any).timeline.every((e: any) => !e.triggered)).toBe(true);
  });

  it('should automatically reset if time travels backward (video loop)', () => {
    const engine = new SyncEngine(mockTimeline);
    const callback = jest.fn();
    engine.registerCallback(callback);

    // Advance to 2500ms -> heavy (1000) and light (2000) trigger
    engine.checkEvents(2500);
    expect(callback).toHaveBeenCalledTimes(2);

    // Travel back to 0ms (simulated loop/restart)
    engine.checkEvents(0);
    expect((engine as any).currentIndex).toBe(0);
  });
});
