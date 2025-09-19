import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { ensureAnonSignIn } from "../src/lib/auth";

export default function RootLayout() {
  const [loaded] = useFonts({
    'GowunDodum-Regular': require("../assets/fonts/GowunDodum-Regular.ttf"),
  });
  useEffect(() => {
    // 앱 시작 시 익명 로그인 보장
    ensureAnonSignIn().catch(console.error);
  }, []);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerTitle: "작은 실패 갤러리" }}>
      <Stack.Screen name="index" options={{ title: "피드" }} />
      <Stack.Screen name="new" options={{ title: "새 글" }} />
      <Stack.Screen name="post/[id]" options={{ title: "상세" }} />
    </Stack>
  );
}