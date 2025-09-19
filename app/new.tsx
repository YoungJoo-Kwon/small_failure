import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createPost } from "../src/lib/posts";
import { ensureAnonSignIn } from "../src/lib/auth";
import { auth } from "../src/lib/firebase";
import Input from "../src/components/common/Input";
import Button from "../src/components/common/Button";
import Card from "../src/components/common/Card";
import { colors, typography, spacing } from "../src/styles/theme";

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
      await ensureAnonSignIn();
      await createPost({
        title,
        body,
        lessons,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        imageUri,
      });
      Alert.alert("게시 완료!", "실패담이 성공적으로 공유되었어요! 🎉");
      setTitle(""); setBody(""); setLessons(""); setTags(""); setImageUri(null);
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  const suggestedTags = ["시험", "프로젝트", "인간관계", "시간관리", "커뮤니케이션", "계획"];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <View style={{ padding: spacing.lg }}>
        {/* 헤더 */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.h2, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            실패담 공유하기
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary }]}>
            실패도 성장의 밑거름이에요. 안전하게 털어놓아보세요! 💪
          </Text>
        </View>

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
              {suggestedTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    const currentTags = tags ? tags.split(',').map(t => t.trim()) : [];
                    if (!currentTags.includes(tag)) {
                      setTags(tags ? `${tags}, ${tag}` : tag);
                    }
                  }}
                  style={{
                    backgroundColor: colors.secondary,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 16,
                    marginRight: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={[typography.caption, { color: colors.text.primary }]}>
                    + {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 이미지 선택 */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              사진 (선택사항)
            </Text>
            <Button
              title={imageUri ? "다른 사진 선택" : "📷 사진 추가"}
              variant="secondary"
              onPress={pickImage}
              style={{ marginBottom: spacing.md }}
            />
            
            {imageUri && (
              <View style={{ marginTop: spacing.sm }}>
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
      </View>
    </ScrollView>
  );
}

console.log("current uid for upload:", auth.currentUser?.uid);
