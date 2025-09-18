import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
