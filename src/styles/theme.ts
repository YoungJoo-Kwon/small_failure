// 작은 실패 갤러리 디자인 시스템
// 기본 테마: #ffffff #faff00 #c4c087 #f6f2cb #005248

export const themes = {
  default: {
    background: '#ffffff',    // 배경색
    primary: '#faff00',       // 메인 액센트 (노란색)
    secondary: '#c4c087',     // 보조 색상 (베이지)
    surface: '#f6f2cb',       // 표면 색상 (연한 베이지)
    accent: '#005248',        // 강조 색상 (진한 녹색)
  },
  // 향후 다른 테마 추가 가능
  warm: {
    background: '#ffffff',
    primary: '#ff6b6b',
    secondary: '#ffa726',
    surface: '#fff3e0',
    accent: '#d84315',
  },
  cool: {
    background: '#ffffff',
    primary: '#42a5f5',
    secondary: '#90caf9',
    surface: '#e3f2fd',
    accent: '#1565c0',
  }
};

// 현재 테마 (기본값)
export const currentTheme = themes.default;

export const colors = {
  // 기본 색상 (현재 테마 기반)
  primary: currentTheme.primary,
  secondary: currentTheme.secondary,
  surface: currentTheme.surface,
  accent: currentTheme.accent,
  background: {
    light: currentTheme.background,
    surface: currentTheme.surface,
    card: currentTheme.background,
  },
  
  // 텍스트 색상
  text: {
    primary: '#2c3e50',      // 진한 회색
    secondary: '#7f8c8d',    // 중간 회색
    disabled: '#bdc3c7',     // 연한 회색
    inverse: '#ffffff',      // 흰색
    accent: currentTheme.accent,  // 강조 텍스트
  },
  
  // 상태별 색상
  success: '#27ae60',        // 성공 (초록)
  warning: '#f39c12',        // 경고 (주황)
  error: '#e74c3c',          // 오류 (빨강)
  info: '#3498db',           // 정보 (파랑)
  
  // 그레이 스케일 (제한적 사용)
  gray: {
    100: '#f8f9fa',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  
  // 다크모드 (향후 확장)
  dark: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      disabled: '#888888',
    }
  }
};

// 글꼴 설정 (나중에 결정)
export const fonts = {
  // 기본 글꼴 스택 (시스템 기본 우선)
  primary: 'GowunDodum-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
};

export const typography = {
  // 제목
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: fonts.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.25,
    fontFamily: fonts.primary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: fonts.primary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: fonts.primary,
  },
  
  // 본문
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: fonts.primary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: fonts.primary,
  },
  
  // 캡션
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: fonts.primary,
  },
  small: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
    fontFamily: fonts.primary,
  },
  
  // 특별
  quote: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    fontStyle: 'italic' as const,
    fontFamily: fonts.primary,
  },
  lesson: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    fontFamily: fonts.primary,
  },
  
  // 버튼 텍스트
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    fontFamily: fonts.primary,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    fontFamily: fonts.primary,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// 모드별 스타일
export const getModeStyles = (isLight: boolean) => ({
  background: isLight ? colors.background.light : colors.dark.background,
  surface: isLight ? colors.background.surface : colors.dark.surface,
  card: isLight ? colors.background.card : colors.dark.background,
  text: {
    primary: isLight ? colors.text.primary : colors.dark.text.primary,
    secondary: isLight ? colors.text.secondary : colors.dark.text.secondary,
    disabled: isLight ? colors.text.disabled : colors.dark.text.disabled,
  }
});
