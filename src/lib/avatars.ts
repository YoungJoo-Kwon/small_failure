// 아바타 관련 유틸리티

// 기본 아바타 파일명 목록
export const DEFAULT_AVATAR_NAMES = [
  "eunji.png",
  "Junho.png",
  "Minji.png",
  "Sohee.png",
  "Sungmin.png",
] as const;

export type DefaultAvatarName = typeof DEFAULT_AVATAR_NAMES[number];

// 기본 아바타 모듈 매핑
export const DEFAULT_AVATAR_MODULES: Record<DefaultAvatarName, any> = {
  "eunji.png": require("../../assets/characters/eunji.png"),
  "Junho.png": require("../../assets/characters/Junho.png"),
  "Minji.png": require("../../assets/characters/Minji.png"),
  "Sohee.png": require("../../assets/characters/Sohee.png"),
  "Sungmin.png": require("../../assets/characters/Sungmin.png"),
};

// 기본 아바타 prefix
const DEFAULT_AVATAR_PREFIX = "default:";

/**
 * 기본 아바타인지 확인
 */
export function isDefaultAvatar(avatarUrl: string | null | undefined): boolean {
  return !!avatarUrl && avatarUrl.startsWith(DEFAULT_AVATAR_PREFIX);
}

/**
 * 기본 아바타 파일명 추출
 */
export function getDefaultAvatarName(avatarUrl: string | null | undefined): DefaultAvatarName | null {
  if (!isDefaultAvatar(avatarUrl)) return null;
  const name = avatarUrl.substring(DEFAULT_AVATAR_PREFIX.length);
  return DEFAULT_AVATAR_NAMES.includes(name as DefaultAvatarName) ? (name as DefaultAvatarName) : null;
}

/**
 * 기본 아바타 식별자 생성
 */
export function createDefaultAvatarId(name: DefaultAvatarName): string {
  return `${DEFAULT_AVATAR_PREFIX}${name}`;
}

/**
 * 아바타 이미지 소스 반환
 * 기본 아바타인 경우 로컬 asset, 그 외는 원격 URL
 * @returns { require: module } | { uri: string } | null
 */
export function getAvatarSource(avatarUrl: string | null | undefined): { uri?: string; require?: any } | null {
  if (!avatarUrl) return null;
  
  if (isDefaultAvatar(avatarUrl)) {
    const name = getDefaultAvatarName(avatarUrl);
    if (name && DEFAULT_AVATAR_MODULES[name]) {
      return { require: DEFAULT_AVATAR_MODULES[name] };
    }
  }
  
  // 원격 URL인 경우
  return { uri: avatarUrl };
}

