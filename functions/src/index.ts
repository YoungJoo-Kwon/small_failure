// functions/src/index.ts
import * as functions from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
admin.initializeApp();

const MIN_LEN = 2;
const MAX_LEN = 20;
const COOLDOWN_DEFAULT_DAYS = 7;

// 간단 금칙어 예시 (실서비스는 더 풍부한 리스트/정규식 권장)
const BLOCKED = ['시발','fuck','sex','admin','운영자'];

function hasBadWord(s: string) {
  const lowered = s.toLowerCase();
  return BLOCKED.some(w => lowered.includes(w));
}

export const requestNicknameChange = functions.onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new functions.HttpsError('unauthenticated','로그인이 필요합니다.');
  const want = (req.data?.displayName ?? '').trim();

  if (want.length < MIN_LEN || want.length > MAX_LEN)
    throw new functions.HttpsError('invalid-argument','닉네임은 2~20자여야 합니다.');

  if (hasBadWord(want))
    throw new functions.HttpsError('failed-precondition','사용할 수 없는 단어가 포함되어 있습니다.');

  const db = getFirestore();
  const profRef = db.doc(`profiles/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(profRef);
    if (!snap.exists) throw new functions.HttpsError('not-found','프로필이 없습니다.');
    const prof = snap.data()!;
    const now = admin.firestore.Timestamp.now();
    const last = prof.lastNickChangeAt ?? prof.createdAt ?? now;
    const cd = prof.changeCooldownDays ?? COOLDOWN_DEFAULT_DAYS;

    // 쿨다운 체크
    const nextAllowed = admin.firestore.Timestamp.fromMillis(last.toMillis() + cd*24*60*60*1000);
    if (now.toMillis() < nextAllowed.toMillis()) {
      throw new functions.HttpsError('failed-precondition',
        `닉네임은 ${cd}일에 1회만 변경할 수 있어요.`);
    }

    // 중복 체크(간단 버전): 동일 문자열을 다른 uid가 쓰는지 조회
    // 규모 커지면 별도 인덱스/handles 컬렉션로 분리 권장
    const dup = await db.collection('profiles')
      .where('displayName','==',want).limit(1).get();
    if (!dup.empty && dup.docs[0].id !== uid) {
      throw new functions.HttpsError('already-exists','이미 사용 중인 닉네임이에요.');
    }

    tx.update(profRef, {
      displayName: want,
      updatedAt: FieldValue.serverTimestamp(),
      lastNickChangeAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});
