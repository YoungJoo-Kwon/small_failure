// v2에서도 admin SDK 초기화는 동일
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();

export const db = getFirestore();
export { FieldValue };
