import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Switch, TouchableOpacity } from "react-native";
import { createPost } from "../src/lib/posts";
import { ensureAnonSignIn } from "../src/lib/auth";
import { auth } from "../src/lib/firebase";
import Input from "../src/components/common/Input";
import Button from "../src/components/common/Button";
import Card from "../src/components/common/Card";
import { useTheme } from "../src/contexts/ThemeContext";
import { useRouter } from "expo-router";
import AppHeader from "../src/components/AppHeader";

export default function NewPostScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lessons, setLessons] = useState("");
  const [tags, setTags] = useState("");
  const [suggestedTagsUsed, setSuggestedTagsUsed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [savePrivate, setSavePrivate] = useState(false);
  const [requestType, setRequestType] = useState<"공감구함" | "조언구함" | "혼쭐내줘">("공감구함");

  async function submit() {
    if (!title || !body || !lessons) {
      return Alert.alert("제목/본문/배운 점은 필수입니다.");
    }
    setBusy(true);
    try {
      await ensureAnonSignIn();
      
      // ✅ uid 보장 확인
      const uid = auth.currentUser?.uid ?? null;
      if (!uid) {
        throw new Error("로그인 세션이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      }
      
      await createPost({
        title,
        body,
        lessons,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: savePrivate ? "hidden" : "active",
        visibility: savePrivate ? "private" : "public",
        requestType,
      });

      // 폼 초기화
      setTitle(""); setBody(""); setLessons(""); setTags(""); setSuggestedTagsUsed([]); setSavePrivate(false); setRequestType("공감구함");
      
      // Alert 없이 바로 홈으로 이동
      router.replace("/");
    } catch (e: any) {
      console.error("createPost failed:", e?.code, e?.message, e);
      Alert.alert("오류", e?.message ?? "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  const suggestedTags = ["시험", "프로젝트", "인간관계", "시간관리", "커뮤니케이션", "계획"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="실패담 공유하기" subtitle="실패도 성장의 밑거름이에요. 안전하게 털어놓아보세요! 💪" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {/* 공개 범위 & 글머리 */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[typography.bodySmall, { color: colors.text.primary, marginRight: spacing.xs }]}>
                비공개
              </Text>
              <Switch
                value={savePrivate}
                onValueChange={setSavePrivate}
                trackColor={{ false: colors.gray[300], true: colors.accent }}
                thumbColor={savePrivate ? colors.primary : colors.gray[400]}
              />
            </View>
          </View>

          {/* 글머리 선택 */}
          <View style={{ flexDirection: "row", columnGap: spacing.sm, marginTop: spacing.sm }}>
            {(["공감구함", "조언구함", "혼쭐내줘"] as const).map((opt) => (
              <Button
                key={opt}
                title={opt}
                size="sm"
                variant={requestType === opt ? "primary" : "secondary"}
                style={requestType === opt ? { backgroundColor: colors.accent, borderColor: colors.accent } : undefined}
                onPress={() => setRequestType(opt)}
              />
            ))}
          </View>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            본문까지 기록 · 글머리로 글의 의도를 표시해 주세요
          </Text>
        </Card>

        {/* 입력 폼 */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Input
            label="실패 상황을 한 줄로 요약해주세요"
            placeholder="예: 시험 망쳤다 😭"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />

          <Input
            label="무슨 일이 있었나요?"
            placeholder="실패 상황을 자세히 설명해주세요..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Input
            label="💡 핵심 교훈"
            placeholder="이 실패에서 배운 점을 한 줄로 정리해주세요"
            value={lessons}
            onChangeText={setLessons}
            maxLength={100}
          />

          <Input
            label="태그 (선택사항)"
            placeholder="쉼표로 구분해서 입력하세요"
            value={tags}
            onChangeText={setTags}
          />

          {/* 추천 태그 */}
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              추천 태그:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {suggestedTags.map((tag) => {
                const isUsed = suggestedTagsUsed.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => {
                      if (!isUsed) {
                        setTags(tags ? `${tags}, ${tag}` : tag);
                        setSuggestedTagsUsed([...suggestedTagsUsed, tag]);
                      }
                    }}
                    disabled={isUsed}
                    style={{
                      backgroundColor: isUsed ? colors.surface : colors.secondary,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: 16,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                      opacity: isUsed ? 0.5 : 1,
                    }}
                  >
                    <Text style={[typography.caption, { color: colors.text.primary }]}>
                      {isUsed ? '✓ ' : '+ '}{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 사진 업로드는 현재 버전에서 비활성화되었습니다. */}
        </Card>

        {/* 제출 버튼 */}
        <Button
          title={busy ? "게시 중..." : "🚀 실패담 공유하기"}
          onPress={submit}
          disabled={busy || !title || !body || !lessons}
          loading={busy}
          size="lg"
          style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
        />

        {/* 안내 메시지 */}
        <View style={{ 
          marginTop: spacing.lg, 
          padding: spacing.md, 
          backgroundColor: colors.surface,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: colors.accent,
        }}>
          <Text style={[typography.bodySmall, { color: colors.text.accent }]}>
            💡 팁: 솔직하고 구체적으로 작성할수록 더 많은 공감과 조언을 받을 수 있어요!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
