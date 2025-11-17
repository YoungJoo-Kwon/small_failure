import { db, serverTimestamp } from "./firebase";
import { doc, setDoc, deleteDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";

export async function attachToPost(srcPostId: string, dstPostId: string, uid: string, note?: string) {
  const edgeId = `${srcPostId}_${dstPostId}_${uid}`;
  await setDoc(doc(db, "attaches", edgeId), {
    srcPostId, dstPostId, authorId: uid,
    year: new Date().getFullYear(),
    createdAt: serverTimestamp(),
    note: note ?? null,
  }, { merge: false });
}

export async function detachFromPost(srcPostId: string, dstPostId: string, uid: string) {
  const edgeId = `${srcPostId}_${dstPostId}_${uid}`;
  await deleteDoc(doc(db, "attaches", edgeId));
}

export async function listAttachesForPost(dstPostId: string) {
  const q = query(
    collection(db, "attaches"),
    where("dstPostId", "==", dstPostId),
    orderBy("createdAt", "desc")
  );
  return await getDocs(q);
}

export async function listMyAttaches(uid: string) {
  const q = query(
    collection(db, "attaches"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc")
  );
  return await getDocs(q);
}
