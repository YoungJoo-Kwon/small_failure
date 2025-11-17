import { auth, db } from "./firebase";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

export async function ensureAnonSignIn() {
  if (auth.currentUser) return auth.currentUser;
  const res = await signInAnonymously(auth);
  const user = res.user;
  const nick = "익명" + user.uid.slice(-4);
  await updateProfile(user, { displayName: nick }).catch(() => {});
  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName || nick,
    createdAt: serverTimestamp()
  }, { merge: true });
  return user;
}

/**
 * 현재 사용자가 관리자인지 확인합니다.
 * profiles/{uid}의 isAdmin 필드를 확인합니다.
 */
export async function isAdmin(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  
  try {
    const profRef = doc(db, "profiles", uid);
    const snap = await getDoc(profRef);
    if (!snap.exists()) return false;
    const data = snap.data();
    return data?.isAdmin === true;
  } catch (e) {
    console.error("[isAdmin] Error checking admin status:", e);
    return false;
  }
}
