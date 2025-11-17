import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useOnboarding } from "../../src/contexts/OnboardingContext";
import Button from "../../src/components/common/Button";

const slides = [
  {
    id: "safe",
    emoji: "🧡",
    title: "작은 실패, 안전하게",
    description: "익명으로 솔직하게 털어놓고, 따뜻한 공감을 받아보세요.",
  },
  {
    id: "growth",
    emoji: "🌱",
    title: "실패를 성장으로",
    description: "핵심 교훈을 기록하고 시리즈로 모아보면 성장의 흐름이 보여요.",
  },
  {
    id: "care",
    emoji: "🤝",
    title: "함께하는 케어",
    description: "멘탈 케어 리소스와 리마인더로 나를 다독여 보세요.",
  },
] as const;

export default function OnboardingScreen() {
  const { colors, typography, spacing } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;
  const current = slides[index];

  const finish = async () => {
    await completeOnboarding();
    router.replace("/");
  };

  const handleNext = async () => {
    if (isLast) {
      await finish();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handleSkip = async () => {
    await finish();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: "space-between" }}>
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ fontSize: 56, marginBottom: spacing.lg }}>{current.emoji}</Text>
          <Text style={[typography.h2, { color: colors.text.primary, marginBottom: spacing.md }]}>
            {current.title}
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 24 }]}>
            {current.description}
          </Text>
        </View>

        <View>
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: spacing.lg }}>
            {slides.map((slide, idx) => (
              <View
                key={slide.id}
                style={{
                  width: idx === index ? 24 : 8,
                  height: 8,
                  borderRadius: 8,
                  marginHorizontal: 4,
                  backgroundColor: idx === index ? colors.accent : colors.gray[300],
                }}
              />
            ))}
          </View>

          <Button
            title={isLast ? "작은 실패 시작하기" : "다음"}
            size="lg"
            onPress={handleNext}
            style={{ marginBottom: spacing.sm, backgroundColor: colors.accent, borderColor: colors.accent }}
          />

          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={{ padding: spacing.sm }}>
              <Text style={[typography.bodySmall, { textAlign: "center", color: colors.text.secondary }]}>
                건너뛰기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

