import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getMyProfile, updateSettings } from '../lib/profiles';
import { getModeStyles, colors as baseColors, typography, spacing, borderRadius, shadows } from '../styles/theme';

export type Theme = 'light' | 'dark' | 'system';

interface ColorScheme {
  primary: string;
  secondary: string;
  surface: string;
  accent: string;
  background: {
    light: string;
    surface: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
    accent: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
  gray: {
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => Promise<void>;
  actualTheme: 'light' | 'dark';
  isDark: boolean;
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// 다크모드 색상 정의
const darkColors: ColorScheme = {
  primary: '#faff00',      // 노란색 유지 (다크모드에서도 강조)
  secondary: '#8b8b5c',   // 다크모드용 베이지 (어둡게)
  surface: '#2a2a1f',     // 어두운 표면
  accent: '#00c9a0',      // 다크모드용 강조색 (밝은 청록색)
  background: {
    light: '#1a1a1a',     // 다크 배경
    surface: '#2a2a1f',   // 어두운 표면
    card: '#242424',      // 카드 배경
  },
  text: {
    primary: '#ffffff',    // 밝은 텍스트
    secondary: '#b0b0b0', // 중간 회색 텍스트
    disabled: '#666666',  // 비활성 텍스트
    inverse: '#000000',   // 역색 (다크모드에서 버튼 텍스트용)
    accent: '#00c9a0',    // 강조 텍스트
  },
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  gray: {
    100: '#2a2a2a',
    200: '#3a3a3a',
    300: '#4a4a4a',
    400: '#5a5a5a',
    500: '#6a6a6a',
    600: '#7a7a7a',
    700: '#8a8a8a',
    800: '#9a9a9a',
    900: '#aaaaaa',
  },
};

// 라이트모드 색상 (기존)
const lightColors: ColorScheme = {
  ...baseColors,
  background: {
    light: baseColors.background.light,
    surface: baseColors.background.surface,
    card: baseColors.background.card,
  },
  text: {
    ...baseColors.text,
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [loading, setLoading] = useState(true);

  // 실제 적용되는 테마 ('light' | 'dark')
  const actualTheme: 'light' | 'dark' = theme === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : theme;

  const isDark = actualTheme === 'dark';

  // 현재 테마에 맞는 색상
  const currentColors = isDark ? darkColors : lightColors;

  // 초기 설정 로드
  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfile();
        if (profile?.settings?.theme) {
          setThemeState(profile.settings.theme as Theme);
        }
      } catch (e) {
        console.error('[ThemeProvider] failed to load theme:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 테마 변경 함수
  const setTheme = async (newTheme: Theme) => {
    try {
      await updateSettings({ theme: newTheme });
      setThemeState(newTheme);
    } catch (e) {
      console.error('[ThemeProvider] failed to update theme:', e);
      throw e;
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
    isDark,
    colors: currentColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
