import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadImageFromUri(uri: string, path: string) {
  const resp = await fetch(uri);
  const blob = await resp.blob();
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return await getDownloadURL(r);
}
