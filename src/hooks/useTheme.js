import { useCallback, useEffect } from 'react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';

export default function useTheme() {
  const theme = useAppStore(s => s.theme);

  const apply = useCallback((newTheme) => {
    useAppStore.getState().setTheme(newTheme);
    const dark = newTheme === 'dark' || (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    IDBStore.setConfig('theme', newTheme);
  }, []);

  const toggle = useCallback(() => {
    const currentTheme = useAppStore.getState().theme;
    const currentActualTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'auto') {
      apply(currentActualTheme === 'dark' ? 'light' : 'dark');
    } else {
      apply(currentTheme === 'dark' ? 'light' : 'dark');
    }
  }, [apply]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = useAppStore.getState().theme;
      if (currentTheme === 'auto') {
        apply('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [apply]);

  return { theme, apply, toggle };
}
