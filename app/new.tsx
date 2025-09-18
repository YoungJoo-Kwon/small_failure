import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createPost } from "../src/lib/posts";
import { ensureAnonSignIn } from "../src/lib/auth";
import { auth } from "../src/lib/firebase";

export default function NewPostScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lessons, setLessons] = useState("");
  const [tags, setTags] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("사진 접근 권한이 필요합니다.");
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function submit() {
    if (!title || !body || !lessons) {
      return Alert.alert("제목/본문/배운 점은 필수입니다.");
    }
    setBusy(true);
    try {
      await ensureAnonSignIn(); // ✅ 업로드/쓰기 전에 항상 로그인 보장
      await createPost({
        title,
        body,
        lessons,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        imageUri,
      });
      Alert.alert("게시 완료!");
      setTitle(""); setBody(""); setLessons(""); setTags(""); setImageUri(null);
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <TextInput
        placeholder="제목"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />
      <TextInput
        placeholder="무슨 일이 있었나요?"
        value={body}
        onChangeText={setBody}
        multiline
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, minHeight: 100 }}
      />
      <TextInput
        placeholder="배운 점(핵심 교훈)"
        value={lessons}
        onChangeText={setLessons}
        multiline
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />
      <TextInput
        placeholder="태그 (쉼표로 구분: 예) 팀워크,시간관리)"
        value={tags}
        onChangeText={setTags}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />

      <Button title={imageUri ? "다른 사진 선택" : "사진 선택(선택)"} onPress={pickImage} />
      <Button title={busy ? "게시 중..." : "게시하기"} onPress={submit} disabled={busy} />
    </View>
  );
}

console.log("current uid for upload:", auth.currentUser?.uid);
