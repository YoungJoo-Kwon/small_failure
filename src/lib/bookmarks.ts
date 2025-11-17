// src/lib/bookmarks.ts
import { auth, db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";

/**
 * 북마크 추가
 */
export async function addBookmark(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  // 중복 체크
  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("이미 북마크한 글입니다.");
  }

  await addDoc(collection(db, "bookmarks"), {
    userId: uid,
    postId,
    createdAt: serverTimestamp(),
  });
}

/**
 * 북마크 제거
 */
export async function removeBookmark(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(postId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    await removeBookmark(postId);
    return false; // 북마크 해제
  } else {
    await addBookmark(postId);
    return true; // 북마크 추가
  }
}

/**
 * 내 북마크 목록 구독
 */
export function listenMyBookmarks(cb: (postIds: string[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb([]);
    return () => {};
  }

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const postIds = snap.docs.map(d => d.data().postId);
    cb(postIds);
  });
}

/**
 * 특정 글의 북마크 여부 확인
 */
export function listenBookmarkStatus(postId: string, cb: (bookmarked: boolean) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb(false);
    return () => {};
  }

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );

  return onSnapshot(q, (snap) => {
    cb(!snap.empty);
  });
}

