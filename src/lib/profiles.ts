// src/lib/profiles.ts
import { auth, db } from "./firebase";
import {
  doc, getDoc, runTransaction, serverTimestamp, updateDoc
} from "firebase/firestore";

export type UserSettings = {
  theme?: "light" | "dark" | "system";
  locale?: "ko" | "en" | string;
  notifyOnReply?: boolean;
};

export type UserProfile = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  settings?: UserSettings;
  createdAt?: any;
  updatedAt?: any;
  lastNickChangeAt?: any;
  changeCooldownDays?: number;
};

// ── 닉네임 정규화(규칙과 동일: 트림 → 소문자)
export function normalizeNick(s: string) {
  return s.trim().toLowerCase();
}

// ── 랜덤 닉 생성기(충돌 시 재시도용)
function randomNick() {
  const adj = ["말랑한","차분한","기운찬","유쾌한","단단한","따뜻한","수줍은","민첩한"];
  const noun = ["토끼","고래","수국","별똥별","연필","구름","바람","솔방울"];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = noun[Math.floor(Math.random() * noun.length)];
  const num = Math.floor(Math.random() * 900 + 100); // 100~999
  return `${a}_${n}${num}`;
}

/**
 * 최초 방문 시 프로필/닉네임을 원자적으로 시딩합니다.
 * - nicknames/{handle} 점유 → profiles/{uid} 생성 (트랜잭션)
 * - 이미 존재하면 아무 것도 하지 않음(멱등)
 * - 인자 호환: 숫자(쿨다운 일수) 또는 문자열(옛 코드의 defaultName)은 무시하고 진행됨
 */
export async function ensureProfileSeed(changeCooldownDaysOrDefaultName?: number | string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const changeCooldownDays =
    typeof changeCooldownDaysOrDefaultName === "number" ? changeCooldownDaysOrDefaultName : 7;

  const profRef = doc(db, "profiles", uid);

  await runTransaction(db, async (tx) => {
    const profSnap = await tx.get(profRef);
    if (profSnap.exists()) return; // 멱등

    // 닉 후보 뽑고 닉네임 인덱스 점유까지 원자적으로 시도
    let candidate = normalizeNick(randomNick());
    let tries = 0;

    while (tries++ < 6) {
      const idxRef = doc(db, "nicknames", candidate);
      const idxSnap = await tx.get(idxRef);

      if (!idxSnap.exists()) {
        // 1) 닉네임 인덱스 점유
        tx.set(idxRef, {
          ownerUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2) 프로필 생성 (displayName = candidate)
        tx.set(profRef, {
          displayName: candidate,
          avatarUrl: null,
          settings: { theme: "system" },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastNickChangeAt: serverTimestamp(),
          changeCooldownDays,
        } as UserProfile);
        return;
      }

      // 충돌 → 새 후보
      candidate = normalizeNick(randomNick());
    }

    throw new Error("닉네임 시딩에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  });
}

/** 내 프로필 일부 필드 업데이트(displayName 제외). */
export async function updateProfile(partial: Partial<UserProfile>) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");
  const profRef = doc(db, "profiles", uid);

  // displayName 변경은 changeNicknameFreePlan()에서만 처리(규칙 충돌 방지)
  const { displayName, ...rest } = partial as any;
  await updateDoc(profRef, { ...rest, updatedAt: serverTimestamp() });
}

/** 앱 설정만 갱신(중첩 필드 머지). */
export async function updateSettings(s: UserSettings) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");
  const profRef = doc(db, "profiles", uid);

  const patch: any = {};
  if (typeof s.theme !== "undefined") patch["settings.theme"] = s.theme;
  if (typeof s.locale !== "undefined") patch["settings.locale"] = s.locale;
  if (typeof s.notifyOnReply !== "undefined") patch["settings.notifyOnReply"] = s.notifyOnReply;

  await updateDoc(profRef, { ...patch, updatedAt: serverTimestamp() });
}

/** 내 프로필 가져오기(없으면 null). */
export async function getMyProfile(): Promise<UserProfile | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const profRef = doc(db, "profiles", uid);
  const snap = await getDoc(profRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
