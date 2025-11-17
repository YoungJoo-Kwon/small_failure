import { auth, db } from "./firebase";
import {
  limit, getDocs, writeBatch, deleteDoc, runTransaction,
  addDoc, collection, doc, getDoc, increment, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where,
  startAfter, QueryDocumentSnapshot
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
  authorNickname?: string | null;
  authorAvatarUrl?: string | null;
  isAnonymous?: boolean;
  likeCount?: number;
  commentCount?: number;
  attachCount?: number;
  createdAt?: any;
  status?: "active" | "hidden";
  visibility?: "public" | "private";
  requestType?: "공감구함" | "조언구함" | "혼쭐내줘";
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
  authorNickname?: string | null;
  authorAvatarUrl?: string | null;
  isAnonymous?: boolean;
};

async function getAuthorSnapshot() {
  const uid = auth.currentUser?.uid ?? null;
  let authorNickname = "익명의 작실인";
  let authorAvatarUrl: string | null = null;

  if (uid) {
    const p = await getDoc(doc(db, "profiles", uid));
    if (p.exists()) {
      const d = p.data() as any;
      authorNickname = d.displayName || authorNickname;
      authorAvatarUrl = d.avatarUrl ?? null;
    }
  }
  return { uid, authorNickname, authorAvatarUrl };
}

export function listenFeed(cb: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const arr: Post[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.status !== "hidden")
      .filter((p) => (p.visibility ?? "public") === "public");
    cb(arr);
  });
}

/**
 * 페이지네이션을 지원하는 피드 구독 (초기 페이지만)
 * @param cb 콜백 함수
 * @param pageSize 페이지 크기 (기본 20)
 */
export function listenFeedPaginated(cb: (posts: Post[]) => void, pageSize: number = 20) {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => {
    const arr: Post[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.status !== "hidden")
      .filter((p) => (p.visibility ?? "public") === "public");
    cb(arr);
  });
}

/**
 * 다음 페이지 로드
 * @param lastPost 마지막 게시물 (startAfter 기준)
 * @param pageSize 페이지 크기 (기본 20)
 * @returns 다음 페이지 게시물 배열
 */
export async function loadNextPage(lastPost: Post, pageSize: number = 20): Promise<Post[]> {
  if (!lastPost.createdAt) return [];
  
  try {
    // lastPost의 createdAt을 사용하여 다음 페이지 쿼리
    const lastDoc = await getDoc(doc(db, "posts", lastPost.id));
    if (!lastDoc.exists()) return [];
    
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );
    
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.status !== "hidden")
      .filter((p) => (p.visibility ?? "public") === "public");
  } catch (e) {
    console.error("[loadNextPage] Error:", e);
    return [];
  }
}

export function getPost(id: string, cb: (p: Post | null, c: Comment[]) => void) {
  const unsubPost = onSnapshot(doc(db, "posts", id), (d) => {
    const post = d.exists() ? ({ id: d.id, ...(d.data() as any) } as Post) : null;
    // 댓글 구독 (orderBy 제거 - 인덱스 문제 방지, 클라이언트에서 정렬)
    const q = query(collection(db, "comments"), where("postId", "==", id));
    const unsubC = onSnapshot(q, (snap) => {
      const comments: Comment[] = snap.docs
        .map((x) => ({ id: x.id, ...(x.data() as any) }))
        // 클라이언트 사이드 정렬 (createdAt 기준)
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return ta - tb; // 오름차순 (오래된 것부터)
        });
      cb(post, comments);
    }, (error) => {
      console.error("[getPost] comments query error:", error);
      // 에러 발생 시 빈 배열로 폴백
      cb(post, []);
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
  title: string;
  body: string;
  lessons: string;
  tags: string[];
  imageUri?: string | null;
  status?: "active" | "hidden";
  visibility?: "public" | "private";
  requestType?: "공감구함" | "조언구함" | "혼쭐내줘";
}) {
  //const uid = auth.currentUser?.uid ?? null;
  const { uid, authorNickname, authorAvatarUrl } = await getAuthorSnapshot();
  if (!uid) throw new Error("로그인이 필요합니다."); // ✅ 방어

  let imageUrl: string | null = null;
  if (opts.imageUri) {
    const filename = `posts/${uid ?? "anon"}/${Date.now()}.jpg`;
    imageUrl = await uploadImageFromUri(opts.imageUri, filename);
  }

  await addDoc(collection(db, "posts"), {
    title: opts.title,
    titleLower: opts.title.toLowerCase(), 
    body: opts.body,
    lessons: opts.lessons,
    tags: opts.tags || [],
    imageUrl: imageUrl,         // ✅ 실제 업로드된 URL 사용
    authorId: uid,
    authorNickname,              // ✅ 스냅샷
    authorAvatarUrl,              // ✅ 스냅샷
    isAnonymous: true,
    likeCount: 0,
    commentCount: 0,
    attachCount: 0,                // (표시용)
    createdAt: serverTimestamp(),
    status: opts.status ?? "active",
    visibility: opts.visibility ?? "public",
    requestType: opts.requestType ?? "공감구함",
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
  const text = body.trim();
  if (!text) throw new Error("댓글이 비어 있습니다.");
  if (text.length > 1000) throw new Error("댓글은 1000자 이하여야 합니다.");

  // ✅ 작성자 스냅샷 공통 헬퍼 사용
  const { uid, authorNickname, authorAvatarUrl } = await getAuthorSnapshot();

  // ✅ 규칙상 로그인 필수면 uid가 없을 때 막기
  if (!uid) throw new Error("로그인이 필요합니다.");

  await addDoc(collection(db, "comments"), {
    postId, 
    type: "text",                // ✅ 타입 명시
    body: text,
    authorId: uid,
    authorNickname,              // ✅
    authorAvatarUrl,             // ✅
    isAnonymous: true,
    createdAt: serverTimestamp()
  });

  // 카운트는 레이스 컨디션을 크게 걱정할 수준이 아니니 increment 유지
  //const pref = doc(db, "posts", postId);
  //await updateDoc(pref, { commentCount: increment(1) });

  // 2) 카운터 증가 (실패해도 댓글 자체는 남도록 try/catch)
  try {
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
  } catch (e) {
    console.warn("commentCount increment failed:", e);
  }
}

export async function deleteComment(commentId: string, postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    console.error("[deleteComment] uid 없음");
    throw new Error("로그인이 필요합니다.");
  }

  console.log("[deleteComment] 시작", { commentId, postId, uid });

  const commentRef = doc(db, "comments", commentId);
  const postRef = doc(db, "posts", postId);
  
  try {
    await runTransaction(db, async (tx) => {
      const commentDoc = await tx.get(commentRef);
      if (!commentDoc.exists()) {
        console.error("[deleteComment] 댓글 없음", { commentId });
        throw new Error("댓글을 찾을 수 없습니다.");
      }
      
      const commentData = commentDoc.data() as any;
      console.log("[deleteComment] 댓글 데이터", { 
        commentId, 
        commentAuthorId: commentData.authorId, 
        currentUid: uid,
        match: commentData.authorId === uid,
        type: typeof commentData.authorId,
        typeUid: typeof uid
      });
      
      // 본인 댓글만 삭제 가능 (문자열 비교, null/undefined 체크)
      const commentAuthorId = String(commentData.authorId || '').trim();
      const currentUid = String(uid || '').trim();
      
      if (commentAuthorId !== currentUid) {
        console.error("[deleteComment] 권한 없음", { 
          commentAuthorId, 
          currentUid,
          commentAuthorIdType: typeof commentAuthorId,
          currentUidType: typeof currentUid
        });
        throw new Error("본인 댓글만 삭제할 수 있습니다.");
      }
      
      // 부모 글의 현재 카운터 읽기
      const postDoc = await tx.get(postRef);
      if (!postDoc.exists()) {
        console.error("[deleteComment] 글 없음", { postId });
        throw new Error("글을 찾을 수 없습니다.");
      }
      
      const postData = postDoc.data() as any;
      const currentCommentCount = (postData.commentCount as number) ?? 0;
      const currentAttachCount = (postData.attachCount as number) ?? 0;
      
      console.log("[deleteComment] 카운터 업데이트", { 
        currentCommentCount, 
        newCommentCount: Math.max(0, currentCommentCount - 1),
        isAttach: commentData.type === "attach",
        currentAttachCount
      });
      
      // 댓글 삭제
      tx.delete(commentRef);
      
      // 부모 글의 카운터 감소 (직접 계산)
      const updates: any = { 
        commentCount: Math.max(0, currentCommentCount - 1)
      };
      // attach 타입이면 attachCount도 감소
      if (commentData.type === "attach") {
        updates.attachCount = Math.max(0, currentAttachCount - 1);
      }
      tx.update(postRef, updates);
      
      console.log("[deleteComment] 트랜잭션 커밋 준비 완료");
    });
    
    console.log("[deleteComment] 성공");
  } catch (error: any) {
    console.error("[deleteComment] 트랜잭션 실패", {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      error
    });
    throw error;
  }
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

export async function setPostVisibility(postId: string, visibility: "public" | "private") {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const postRef = doc(db, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) throw new Error("글을 찾을 수 없습니다.");
    const data = snap.data() as any;
    if (data.authorId !== uid) throw new Error("본인 글만 공개 여부를 바꿀 수 있습니다.");
    tx.update(postRef, { visibility });
  });
}

/**
 * 글 수정
 */
export async function updatePost(
  postId: string,
  opts: {
    title: string;
    body: string;
    lessons: string;
    tags: string[];
    requestType?: "공감구함" | "조언구함" | "혼쭐내줘";
    visibility?: "public" | "private";
  }
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const postRef = doc(db, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) throw new Error("글을 찾을 수 없습니다.");
    const data = snap.data() as any;
    if (data.authorId !== uid) throw new Error("본인 글만 수정할 수 있습니다.");

    // 업데이트할 필드만 변경 (카운트 필드는 제외)
    tx.update(postRef, {
      title: opts.title,
      titleLower: opts.title.toLowerCase(),
      body: opts.body,
      lessons: opts.lessons,
      tags: opts.tags || [],
      ...(opts.requestType && { requestType: opts.requestType }),
      ...(opts.visibility && { visibility: opts.visibility }),
    });
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
  //const uid = auth.currentUser?.uid ?? null;
  const { uid, authorNickname, authorAvatarUrl } = await getAuthorSnapshot();
  if (!uid) throw new Error("로그인이 필요합니다.");

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
    authorNickname,              // ✅
    authorAvatarUrl,             // ✅
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