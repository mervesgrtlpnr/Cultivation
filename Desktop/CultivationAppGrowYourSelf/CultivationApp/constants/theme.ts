/**
 * Cultivation — doğa / yeşil tonlarında açık ve koyu tema.
 */

import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const Colors = {
  light: {
    text: '#1c2e22',
    textSecondary: '#52716a',
    background: '#F8FCF9',
    surface: '#E8F5E9',
    tint: '#1e6845',
    icon: '#52716a',
    tabIconDefault: '#88a899',
    tabIconSelected: '#1e6845',
    border: '#D4E8D8',
  },
  dark: {
    text: '#e6f4ea',
    textSecondary: '#95b8a8',
    background: '#121212',
    surface: '#142920',
    tint: '#74c69d',
    icon: '#95b8a8',
    tabIconDefault: '#5c7268',
    tabIconSelected: '#b7e4c7',
    border: '#2a4238',
  },
};

export function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.tint,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.tint,
    },
  };
}
