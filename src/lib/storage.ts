import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";

export async function uploadImageFromUri(uri: string, path: string) {
  let data: Uint8Array;
  
  console.log("[uploadImageFromUri] Starting upload, uri:", uri.substring(0, 50) + "...");
  
  try {
    // 로컬 파일 URI (file://) 또는 asset URI인 경우 expo-file-system 사용
    if (uri.startsWith("file://") || uri.startsWith("asset://") || !uri.startsWith("http")) {
      console.log("[uploadImageFromUri] Reading local file...");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      console.log("[uploadImageFromUri] File read, base64 length:", base64.length);
      
      // Base64를 Uint8Array로 변환
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      data = new Uint8Array(byteNumbers);
      console.log("[uploadImageFromUri] Converted to Uint8Array, length:", data.length);
    } else {
      // 원격 URI인 경우 fetch 사용
      console.log("[uploadImageFromUri] Fetching remote URI...");
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const arrayBuffer = await blob.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
      console.log("[uploadImageFromUri] Fetched and converted, length:", data.length);
    }
    
    console.log("[uploadImageFromUri] Uploading to Firebase Storage...");
    const r = ref(storage, path);
    await uploadBytes(r, data);
    console.log("[uploadImageFromUri] Upload complete, getting download URL...");
    const downloadUrl = await getDownloadURL(r);
    console.log("[uploadImageFromUri] Success! URL:", downloadUrl.substring(0, 50) + "...");
    return downloadUrl;
  } catch (error: any) {
    console.error("[uploadImageFromUri] Error:", error);
    console.error("[uploadImageFromUri] Error message:", error?.message);
    console.error("[uploadImageFromUri] Error stack:", error?.stack);
    throw new Error(`이미지 업로드 실패: ${error?.message ?? error}`);
  }
}
