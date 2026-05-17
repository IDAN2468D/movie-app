import { renderHook, act } from '@testing-library/react-native';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import { Alert } from 'react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

describe('useForgotPassword', () => {
  const mockAlert = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty email and not loading', () => {
    const { result } = renderHook(() => useForgotPassword());
    expect(result.current.email).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('should show alert if email is missing', async () => {
    const { result } = renderHook(() => useForgotPassword());
    
    await act(async () => {
      await result.current.handleResetPassword();
    });

    expect(mockAlert).toHaveBeenCalledWith('מידע חסר', 'נא להזין כתובת אימייל');
  });

  it('should simulate password reset success', async () => {
    const { result } = renderHook(() => useForgotPassword());
    
    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      result.current.handleResetPassword();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith(
      'אימייל נשלח',
      expect.stringContaining('שלחנו לך הוראות'),
      expect.any(Array)
    );
  });

  it('should navigate back when navigateBack is called', () => {
    const { result } = renderHook(() => useForgotPassword());
    
    act(() => {
      result.current.navigateBack();
    });

    expect(router.back).toHaveBeenCalled();
  });
});
