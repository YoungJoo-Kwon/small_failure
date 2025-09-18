import { Stack } from "expo-router";
import { useEffect } from "react";
import { ensureAnonSignIn } from "../src/lib/auth";

export default function RootLayout() {
  useEffect(() => {
    // 앱 시작 시 익명 로그인 보장
    ensureAnonSignIn().catch(console.error);
  }, []);

  return (
    <Stack screenOptions={{ headerTitle: "작은 실패 갤러리" }}>
      <Stack.Screen name="index" options={{ title: "피드" }} />
      <Stack.Screen name="new" options={{ title: "새 글" }} />
      <Stack.Screen name="post/[id]" options={{ title: "상세" }} />
    </Stack>
  );
}