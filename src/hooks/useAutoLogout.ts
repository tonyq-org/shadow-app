import {useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';
import {useAuthStore} from '../store/authStore';
import {useSettingsStore} from '../store/settingsStore';

export function useAutoLogout() {
  const logout = useAuthStore(s => s.logout);
  const minutes = useSettingsStore(s => s.autoLogoutMinutes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    lastActiveRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      logout();
    }, minutes * 60 * 1000);
  }, [minutes, logout]);

  useEffect(() => {
    resetTimer();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed > minutes * 60 * 1000) {
          logout();
        } else {
          resetTimer();
        }
      } else {
        lastActiveRef.current = Date.now();
      }
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      subscription.remove();
    };
  }, [minutes, logout, resetTimer]);

  return {resetTimer};
}
