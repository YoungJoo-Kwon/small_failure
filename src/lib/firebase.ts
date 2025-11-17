import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔧 여기에 Firebase 콘솔에서 받은 값으로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyBXEL1OE-DVyh7ZzA41kxfS5ti8QmVQTEc",
  authDomain: "small-failure-pilot.firebaseapp.com",
  projectId: "small-failure-pilot",
  //storageBucket: "small-failure-pilot.firebasestorage.app", 
  storageBucket: "small-failure-pilot.appspot.com",
  appId: "1:82200394145:web:b403c3405c355eca8633e0"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// 선택: 안전하게 버킷을 명시하고 싶어서...
//export const storage = getStorage(app);
export const storage = getStorage(app, "gs://small-failure-pilot.appspot.com");

// --- (추가) 익명 로그인 + 첫 방문 시딩 ---
export async function ensureAnonSignIn() {
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!;
}

function randomNick() {
  const adj = ['말랑한','차분한','기운찬','유쾌한','단단한','따뜻한','수줍은','민첩한'];
  const noun = ['토끼','고래','수국','별똥별','연필','구름','바람','솔방울'];
  const a = adj[Math.floor(Math.random()*adj.length)];
  const n = noun[Math.floor(Math.random()*noun.length)];
  const suffix = Math.floor(Math.random()*900+100);
  return `${a}_${n}${suffix}`;
}

export async function ensureProfileSeed(changeCooldownDays=7) {
  const user = await ensureAnonSignIn();
  const ref = doc(db, 'profiles', user.uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        displayName: randomNick(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastNickChangeAt: serverTimestamp(),
        changeCooldownDays
      });
    }
  });
}
