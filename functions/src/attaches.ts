// v2 Firestore 트리거 문법 사용
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { db, FieldValue } from "./firebase";

type AttachDoc = {
  srcPostId: string;
  dstPostId: string;
  authorId: string;
  year?: number;
  createdAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null;
  note?: string | null;
};

// attaches/{edgeId} 문서 생성/삭제 시 동작
export const onAttachWrite = onDocumentWritten("attaches/{edgeId}", async (event) => {
  // v2의 event에는 before/after 스냅샷이 들어있음
  const before = event.data?.before?.data() as AttachDoc | undefined;
  const after  = event.data?.after?.data() as AttachDoc  | undefined;

  // 업데이트(둘 다 존재)는 비정상 시나리오로 간주(규칙상 업데이트 금지 가정)
  if (before && after) {
    logger.warn("[attaches] unexpected update:", event.params.edgeId);
    return;
  }

  // 생성(+1) 또는 삭제(-1)
  const delta = after ? +1 : -1;
  const doc = (after ?? before);
  if (!doc) return;

  const { srcPostId, dstPostId } = doc;
  if (!srcPostId || !dstPostId) {
    logger.error("[attaches] missing src/dst post ids:", event.params.edgeId, doc);
    return;
  }

  const srcRef = db.doc(`posts/${srcPostId}`);
  const dstRef = db.doc(`posts/${dstPostId}`);

  // 존재 검증 (권장)
  const [srcSnap, dstSnap] = await Promise.all([srcRef.get(), dstRef.get()]);
  if (!srcSnap.exists || !dstSnap.exists) {
    logger.error("[attaches] invalid edge; src/dst missing:", event.params.edgeId, {
      srcExists: srcSnap.exists,
      dstExists: dstSnap.exists,
    });
    // 생성 이벤트였다면 잘못된 엣지 롤백(삭제)
    if (after && !before) {
      try {
        await db.doc(`attaches/${event.params.edgeId}`).delete();
      } catch (e) {
        logger.error("[attaches] rollback failed:", e);
      }
    }
    return;
  }

  // attachCount 집계
  try {
    await dstRef.update({
      attachCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.error("[attaches] failed to update attachCount:", {
      dstPostId, delta, edgeId: event.params.edgeId, error: e,
    });
  }
});
