// 아바타 표시 헬퍼: 현재 사용자의 경우 실시간 프로필 아바타 사용

import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAvatarSource } from "./avatars";

// 프로필 캐시 (성능 최적화)
const profileCache = new Map<string, { avatarUrl: string | null; timestamp: number }>();
const CACHE_DURATION = 60000; // 1분

/**
 * 사용자의 현재 프로필 아바타 가져오기 (캐싱 포함)
 */
async function getCurrentProfileAvatar(uid: string | null | undefined): Promise<string | null> {
  if (!uid) return null;
  
  // 캐시 확인
  const cached = profileCache.get(uid);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.avatarUrl;
  }
  
  try {
    const profRef = doc(db, "profiles", uid);
    const profSnap = await getDoc(profRef);
    if (profSnap.exists()) {
      const data = profSnap.data() as any;
      const avatarUrl = data.avatarUrl ?? null;
      // 캐시 저장
      profileCache.set(uid, { avatarUrl, timestamp: Date.now() });
      return avatarUrl;
    }
  } catch (error) {
    console.error("[getCurrentProfileAvatar] Error:", error);
  }
  
  return null;
}

/**
 * 게시물/댓글 표시용 아바타 소스 가져오기
 * 현재 사용자의 경우 실시간 프로필 아바타, 다른 사용자는 스냅샷 사용
 */
export async function getDisplayAvatarSource(
  authorId: string | null | undefined,
  snapshotAvatarUrl: string | null | undefined
): Promise<{ uri?: string; require?: any } | null> {
  const currentUid = auth.currentUser?.uid;
  
  // 현재 사용자의 게시물/댓글인 경우 실시간 프로필 아바타 사용
  if (authorId && currentUid && authorId === currentUid) {
    const currentAvatarUrl = await getCurrentProfileAvatar(authorId);
    if (currentAvatarUrl) {
      return getAvatarSource(currentAvatarUrl);
    }
  }
  
  // 다른 사용자이거나 스냅샷이 있는 경우 스냅샷 사용
  if (snapshotAvatarUrl) {
    return getAvatarSource(snapshotAvatarUrl);
  }
  
  return null;
}

/**
 * 프로필 캐시 무효화 (아바타 변경 후 호출)
 */
export function invalidateProfileCache(uid?: string) {
  if (uid) {
    profileCache.delete(uid);
  } else {
    profileCache.clear();
  }
}

