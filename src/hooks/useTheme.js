import { useState, useCallback, useEffect, useRef } from 'react';
import { useThemeStore } from '@/status';
import { IDBStore } from '@/services/storage';

function computeIsDark(theme) {
  return theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export default function useTheme() {
  const theme = useThemeStore(s => s.theme);
  const [isDark, setIsDark] = useState(() => computeIsDark(useThemeStore.getState().theme));
  const prevThemeRef = useRef(theme);

  const apply = useCallback((newTheme) => {
    useThemeStore.getState().setTheme(newTheme);
    const dark = computeIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    IDBStore.setConfig('theme', newTheme);
    requestAnimationFrame(() => {
      useThemeStore.getState().triggerHoneycombRedraw();
    });
  }, []);

  const toggle = useCallback(() => {
    const dark = computeIsDark(useThemeStore.getState().theme);
    apply(dark ? 'light' : 'dark');
  }, [apply]);

  // 响应式更新 isDark：store theme 变化 + 系统偏好变化
  useEffect(() => {
    const update = () => {
      const t = useThemeStore.getState().theme;
      setIsDark(computeIsDark(t));
    };

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', update);

    // 监听 store theme 变化
    const unsub = useThemeStore.subscribe((state) => {
      if (state.theme !== prevThemeRef.current) {
        prevThemeRef.current = state.theme;
        update();
      }
    });

    return () => {
      mediaQuery.removeEventListener('change', update);
      unsub();
    };
  }, []);

  // auto 模式下系统偏好变化时同步 data-theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === 'auto') {
        apply('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [apply]);

  return { theme, isDark, apply, toggle };
}
