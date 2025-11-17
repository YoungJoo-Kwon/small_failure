import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { ensureAnonSignIn } from "../src/lib/auth";
import { ensureProfileSeed } from "../src/lib/profiles";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { SettingsProvider } from "../src/contexts/SettingsContext";
import { OnboardingProvider, useOnboarding } from "../src/contexts/OnboardingContext";

function AppStack() {
  const { loading, completed } = useOnboarding();

  if (loading) return null;

  if (!completed) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="care" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    'GowunDodum-Regular': require("../assets/fonts/GowunDodum-Regular.ttf"),
  });

  const bootedRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (bootedRef.current) return;
      bootedRef.current = true;
      try {
        await ensureAnonSignIn();
        await ensureProfileSeed();
      } catch (e) {
        console.error("[boot] profile seed failed:", e);
      }
    })();
  }, []);

  if (!loaded) return null;

  return (
    <OnboardingProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AppStack />
        </SettingsProvider>
      </ThemeProvider>
    </OnboardingProvider>
  );
}
