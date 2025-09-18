import { auth, db } from "./firebase";
import {
  limit, getDocs, writeBatch, deleteDoc, runTransaction,
  addDoc, collection, doc, getDoc, increment, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import { uploadImageFromUri } from "./storage";

export type Post = {
  id: string;
  title: string;
  body: string;
  lessons: string;
  tags: string[];
  imageUrl?: string | null;
  authorId?: string | null;
  isAnonymous?: boolean;
  likeCount?: number;
  commentCount?: number;
  createdAt?: any;
  status?: "active" | "hidden";
};

export type Comment = {
  id: string;
  postId: string;
  body: string;
  createdAt?: any;
  authorId?: string | null;
  isAnonymous?: boolean;
};

export function listenFeed(cb: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const arr: Post[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.status !== "hidden");
    cb(arr);
  });
}

export function getPost(id: string, cb: (p: Post | null, c: Comment[]) => void) {
  const unsubPost = onSnapshot(doc(db, "posts", id), (d) => {
    const post = d.exists() ? ({ id: d.id, ...(d.data() as any) } as Post) : null;
    // 댓글 구독
    const q = query(collection(db, "comments"), where("postId", "==", id), orderBy("createdAt", "asc"));
    const unsubC = onSnapshot(q, (snap) => {
      const comments: Comment[] = snap.docs.map((x) => ({ id: x.id, ...(x.data() as any) }));
      cb(post, comments);
    });
    // 반환: 댓글 구독을 정리할 수 있도록 합성
    (unsubPost as any).__child = unsubC;
  });

  return () => {
    const child = (unsubPost as any).__child;
    if (typeof child === "function") child();
    unsubPost();
  };
}

export async function createPost(opts: {
  title: string; body: string; lessons: string; tags: string[]; imageUri?: string | null;
}) {
  const uid = auth.currentUser?.uid ?? null;
  let imageUrl: string | null = null;

  if (opts.imageUri) {
    const filename = `posts/${uid ?? "anon"}/${Date.now()}.jpg`;
    imageUrl = await uploadImageFromUri(opts.imageUri, filename);
  }

  await addDoc(collection(db, "posts"), {
    title: opts.title,
    body: opts.body,
    lessons: opts.lessons,
    tags: opts.tags || [],
    imageUrl: null,             // 사진 보류 단계
    authorId: uid,
    isAnonymous: true,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    status: "active"
  });
}

// 글과 그에 속한 댓글을 함께 삭제(하드 삭제)
export async function deletePostAndComments(postId: string) {
  // 1) 댓글 먼저 삭제
  const q = query(collection(db, "comments"), where("postId", "==", postId));
  const snap = await getDocs(q);

  // 500개 단위 배치 처리
  let batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    if (count % 450 === 0) { // 여유 있게 커밋
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();

  // 2) 글 삭제 (작성자 권한 필요)
  await runTransaction(db, async (tx) => {
    const pRef = doc(db, "posts", postId);
    tx.delete(pRef);
  });
}

export async function toggleLike(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  // 간단 버전: 중복 방지 미구현(데모용). 추후 Likes 서브컬렉션으로 확장하세요.
  const ref = doc(db, "posts", postId);
  await updateDoc(ref, { likeCount: increment(1) });
}

export async function addComment(postId: string, body: string) {
  const uid = auth.currentUser?.uid ?? null;
  const text = body.trim();
  if (!text) throw new Error("댓글이 비어 있습니다.");
  if (text.length > 1000) throw new Error("댓글은 1000자 이하여야 합니다.");

  await addDoc(collection(db, "comments"), {
    postId, body: text,
    authorId: uid,
    isAnonymous: true,
    createdAt: serverTimestamp()
  });

  // 카운트는 레이스 컨디션을 크게 걱정할 수준이 아니니 increment 유지
  const pref = doc(db, "posts", postId);
  await updateDoc(pref, { commentCount: increment(1) });
}

export async function reportPost(postId: string, reason: string) {
  const uid = auth.currentUser?.uid ?? null;
  await addDoc(collection(db, "reports"), {
    targetType: "post",
    targetId: postId,
    reason,
    reporterId: uid,
    createdAt: serverTimestamp(),
    status: "open"
  });
}

export async function toggleLikeRobust(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const likeRef = doc(db, "posts", postId, "likes", uid);
  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (tx) => {
    const likeDoc = await tx.get(likeRef);
    const postDoc = await tx.get(postRef);
    if (!postDoc.exists()) throw new Error("Post not found");

    const current = (postDoc.data().likeCount as number) || 0;

    if (likeDoc.exists()) {
      // 이미 좋아요 → 취소
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: Math.max(0, current - 1) });
    } else {
      // 새 좋아요
      tx.set(likeRef, { userId: uid, createdAt: serverTimestamp() });
      tx.update(postRef, { likeCount: current + 1 });
    }
  });
}