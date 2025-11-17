// src/services/posts.ts
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// 화면 폴백 문자열은 UI에서 처리하지만, 서비스 레벨에서도 안전망 유지
const FALLBACK_NICK = "익명의 작실인";

async function getDisplayName(uid: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    const name = snap.exists() ? (snap.data() as any).displayName : null;
    return (name && String(name)) || FALLBACK_NICK;
  } catch {
    return FALLBACK_NICK;
  }
}

export type CreatePostInput = {
  title: string;
  body: string;
  lessons?: string;
  tags?: string[];
};

export async function createPost(input: CreatePostInput) {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const uid = user.uid;

  const authorNickname = await getDisplayName(uid); // ★ 프로필에서 닉네임 스냅샷

  const payload = {
    title: input.title,
    body: input.body,
    lessons: input.lessons ?? "",
    tags: input.tags ?? [],
    authorId: uid,
    authorNickname,                       // ★ 스냅샷 주입
    createdAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
    attachCount: 0,
  };

  // 보안 규칙: authorId == auth.uid, createdAt 존재 → 통과
  const ref = await addDoc(collection(db, "posts"), payload);
  return ref.id;
}
