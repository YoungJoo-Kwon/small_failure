// src/lib/userContent.ts
import { db, auth } from "./firebase";
import {
  collection, onSnapshot, orderBy, query, where, limit,
} from "firebase/firestore";
import type { Post, Comment } from "./posts";

export function listenMyPosts(cb: (posts: Post[]) => void, onErr?: (e:any)=>void) {
  const uid = auth.currentUser?.uid;
  if (!uid) { cb([]); return () => {}; }

  // 인덱스 필요할 수 있음: authorId == uid + orderBy createdAt desc
  const qy = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(
    qy,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))),
    err => onErr?.(err)
  );
}

export function listenMyComments(cb: (comments: Comment[]) => void, onErr?: (e:any)=>void) {
  const uid = auth.currentUser?.uid;
  if (!uid) { cb([]); return () => {}; }

  const qy = query(
    collection(db, "comments"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    qy,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))),
    err => onErr?.(err)
  );
}
