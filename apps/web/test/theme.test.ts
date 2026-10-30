import { describe, it, expect } from 'vitest';
import { useThemeStore } from '../src/lib/theme';

describe('Theme management', () => {
  it('initializes and toggles theme', () => {
    const store = useThemeStore.getState();
    expect(['light', 'dark', 'system']).toContain(store.theme);

    store.setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');

    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
  });
});
