import {create} from 'zustand';

interface SettingsState {
  autoLogoutMinutes: number;
  language: string;
  setAutoLogoutMinutes: (minutes: number) => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  autoLogoutMinutes: 5,
  language: 'zh-TW',
  setAutoLogoutMinutes: minutes => set({autoLogoutMinutes: minutes}),
  setLanguage: lang => set({language: lang}),
}));
