import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function applyThemeToDom(resolved: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialSetting = (
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('st-theme') as ThemeMode) || 'system'
      : 'system'
  ) as ThemeMode;

  const resolved = resolveTheme(initialSetting);
  applyThemeToDom(resolved);

  // Listen to system theme changes if set to system
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const current = get().theme;
      if (current === 'system') {
        const nextResolved = getSystemTheme();
        applyThemeToDom(nextResolved);
        set({ resolvedTheme: nextResolved });
      }
    });
  }

  return {
    theme: initialSetting,
    resolvedTheme: resolved,
    setTheme: (next: ThemeMode) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('st-theme', next);
      }
      const nextResolved = resolveTheme(next);
      applyThemeToDom(nextResolved);
      set({ theme: next, resolvedTheme: nextResolved });
    },
    toggleTheme: () => {
      const currentResolved = get().resolvedTheme;
      const next: ThemeMode = currentResolved === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('st-theme', next);
      }
      applyThemeToDom(next);
      set({ theme: next, resolvedTheme: next });
    },
  };
});
