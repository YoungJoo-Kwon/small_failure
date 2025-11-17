// src/lib/nickChange.ts
import { db, auth } from './firebase';
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';

const normalize = (s: string) => s.trim().toLowerCase();

export async function changeNicknameFreePlan(raw: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('로그인이 필요합니다.');
  const uid = u.uid;
  const newHandle = normalize(raw);
  const profRef = doc(db, 'profiles', uid);
  const idxRef = doc(db, 'nicknames', newHandle);

  await runTransaction(db, async (tx) => {
    const profSnap = await tx.get(profRef);
    if (!profSnap.exists()) throw new Error('프로필이 없습니다.');
    const prof = profSnap.data() as any;

    // 쿨다운(프론트에서도 1차 체크)
    const cooldownDays = prof.changeCooldownDays ?? 7;
    const last = prof.lastNickChangeAt?.toMillis?.() ?? 0;
    if (last && Date.now() < last + cooldownDays*24*60*60*1000) {
      throw new Error(`닉네임은 ${cooldownDays}일에 1회만 변경할 수 있어요.`);
    }

    // 새 닉 점유(있으면 내가 주인인지 확인)
    const idxSnap = await tx.get(idxRef);
    if (idxSnap.exists() && idxSnap.data()?.ownerUid !== uid) {
      throw new Error('이미 사용 중인 닉네임이에요.');
    }
    if (!idxSnap.exists()) {
      tx.set(idxRef, { ownerUid: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }

    // 이전 핸들
    const oldHandle = normalize(prof.displayName || '');

    // 프로필 업데이트
    tx.update(profRef, {
      displayName: newHandle,
      updatedAt: serverTimestamp(),
      lastNickChangeAt: serverTimestamp(),
    });

    // 이전 핸들 반납
    if (oldHandle && oldHandle !== newHandle) {
      tx.delete(doc(db, 'nicknames', oldHandle));
    }
  });
}
