// src/lib/likes.ts
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

/** 현재 유저가 특정 post를 좋아요 했는지 실시간 구독 */
export function listenMyLike(postId: string, cb: (liked: boolean) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb(false);
    return () => {};
  }
  const ref = doc(db, "posts", postId, "likes", uid);
  return onSnapshot(ref, (snap) => cb(snap.exists()));
}
