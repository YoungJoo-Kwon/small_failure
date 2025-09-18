import { auth, db } from "./firebase";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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
