// src/services/comments.ts
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { ensureAnonSignIn } from "../lib/auth";      // ← 진짜로 uid 확보
import { ensureProfileSeed } from "../lib/profiles"; // ← 시딩 보장

const FALLBACK_NICK = "익명의 실패인";

async function getDisplayName(uid: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    const name = snap.exists() ? (snap.data() as any).displayName : null;
    return (name && String(name)) || FALLBACK_NICK;
  } catch {
    return FALLBACK_NICK;
  }
}

export async function addTextComment(postId: string, body: string) {
  // 1) 인증/시딩 보장
  await ensureAnonSignIn();
  await ensureProfileSeed(7);

  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const uid = user.uid;

  // 2) 닉네임 스냅샷 확보
  const authorNickname = await getDisplayName(uid);

  // 3) 규칙에 맞는 payload 작성
  const payload = {
    postId,
    type: "text",
    body,
    authorId: uid,
    authorNickname,
    createdAt: serverTimestamp(),
  };

  // 4) 쓰기
  await addDoc(collection(db, "comments"), payload);
}
