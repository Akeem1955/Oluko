import { useThemeContext } from '@/components/providers/ThemeProvider';

export function useTheme() {
  const { theme, setTheme } = useThemeContext();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return { theme, setTheme, toggleTheme };
}
