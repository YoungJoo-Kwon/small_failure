import { auth, db } from "../lib/firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

export async function devResetCurrentSeed() {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const uid = user.uid;

  await runTransaction(db, async (tx) => {
    const profRef = doc(db, "profiles", uid);
    const profSnap = await tx.get(profRef);
    if (profSnap.exists()) {
      const displayName = (profSnap.data() as any).displayName;
      if (displayName) {
        const idxRef = doc(db, "nicknames", String(displayName).trim().toLowerCase());
        const idxSnap = await tx.get(idxRef);
        if (idxSnap.exists() && idxSnap.data()?.ownerUid === uid) {
          tx.delete(idxRef); // 닉 인덱스 반납
        }
      }
      tx.delete(profRef);     // 프로필 삭제
    }
  });

  // 현재 익명 계정 삭제 → 다음 진입 시 새 uid 발급
  try {
    await user.delete();
  } catch {
    await auth.signOut();
  }
}
