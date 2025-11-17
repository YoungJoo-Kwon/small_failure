import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

// One-off helper to backfill requestType on existing posts to "공감구함".
export async function backfillPostsRequestType() {
  // Firestore에서는 '필드가 없음' 조건이 직접 지원되지 않아, 클라이언트에서 필터링
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);
  let count = 0;
  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    if (!data.requestType) {
      batch.update(docSnap.ref, { requestType: "공감구함" });
      count++;
      // 안전하게 450개 단위로 커밋
      if (count > 0 && count % 450 === 0) {
        // note: caller should await sequential runs if needed
      }
    }
  });
  if (count > 0) {
    await batch.commit();
  }
  return count;
}

