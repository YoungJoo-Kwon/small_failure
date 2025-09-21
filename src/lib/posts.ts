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
  body?: string;
  type?: "text" | "attach";

  // ✅ attach 타입일 때만 쓰는 필드들
  attachedPostId?: string;
  attachedTitle?: string;
  attachedSnippet?: string;
  attachedLessons?: string;
  attachedImageUrl?: string | null;

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
    titleLower: opts.title.toLowerCase(), // ✅ 추가
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

export function searchPostsByTitlePrefix(prefix: string, cb: (posts: Post[]) => void) {
  const key = prefix.toLowerCase();
  const end = key + '\uf8ff'; // prefix 범위
  const q = query(
    collection(db, "posts"),
    where("titleLower", ">=", key),
    where("titleLower", "<=", end),
    orderBy("titleLower"),
    limit(20)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
  );
}

export function searchByTag(tag: string, cb: (posts: Post[]) => void) {
  const q = query(
    collection(db, "posts"),
    where("tags", "array-contains", tag),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
  );
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

export function listenMyPosts(uid: string, cb: (posts: Post[]) => void, onErr?: (e:any)=>void) {
  const qy = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
    limit(50)
  );
  return onSnapshot(qy,
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))),
    (e) => onErr?.(e)  // ✅ 에러 핸들링해서 토스트/Alert로 알려주기
  );
}

// ✅ 다른 실패담을 댓글로 '붙이기'
export async function addAttachComment(parentPostId: string, childPostId: string) {
  const uid = auth.currentUser?.uid ?? null;

  // child 미리보기 데이터 한 번 읽어서 댓글에 '정규화(denormalize)'
  const childRef = doc(db, "posts", childPostId);
  const snap = await getDoc(childRef);
  if (!snap.exists()) throw new Error("붙일 실패담을 찾을 수 없습니다.");
  const child = snap.data() as any;

  // 미리보기용 스니펫 (본문 앞 100~140자 정도 잘라 저장)
  const raw = (child.body ?? "").toString();
  const snippet = raw.length > 140 ? raw.slice(0, 140) + "…" : raw;

  // 댓글 컬렉션에 attach 타입으로 저장
  await addDoc(collection(db, "comments"), {
    postId: parentPostId,
    type: "attach",
    body: "",                            // ✅ 비어 있어도 필드는 채움
    attachedPostId: childPostId,
    attachedTitle: child.title ?? "",
    attachedSnippet: snippet,
    attachedLessons: child.lessons ?? "",
    attachedImageUrl: child.imageUrl ?? null,
    authorId: uid,
    isAnonymous: true,
    createdAt: serverTimestamp(),
  });

  // 부모 글의 attachCount(표시용) 증가 (선택)
  const pref = doc(db, "posts", parentPostId);
  await updateDoc(pref, { 
    attachCount: increment(1),
    commentCount: increment(1), 
  });
}