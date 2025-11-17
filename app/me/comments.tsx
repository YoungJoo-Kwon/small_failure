// app/me/comments.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import Card from "../../src/components/common/Card";
import Button from "../../src/components/common/Button";
import AppHeader from "../../src/components/AppHeader";

import { ensureAnonSignIn } from "../../src/lib/auth";
import { ensureProfileSeed } from "../../src/lib/profiles";
import { listenMyComments } from "../../src/lib/userContent";
import { formatKST } from "../../src/lib/datetime";
import type { Comment } from "../../src/lib/posts";

export default function MyCommentsScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: any;
    (async () => {
      try {
        await ensureAnonSignIn();
        await ensureProfileSeed("익명의 실패러");
        unsub = listenMyComments(setItems, (e) => console.error("listenMyComments:", e));
      } catch (e:any) {
        Alert.alert("오류", e?.message ?? "내 댓글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub && unsub();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="내 댓글" subtitle="댓글과 붙이기 기록을 확인하세요." />
      <View style={{ flex: 1, padding: spacing.lg }}>
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          ListEmptyComponent={
            !loading ? (
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                아직 남긴 댓글이 없어요. 공감과 댓글로 대화를 시작해보세요!
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Card key={item.id} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background.light }}>
              {/* attach 댓글일 경우 카드 헤더 변경 */}
              <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: 2 }]}>
                {item.type === "attach" ? "🔗 붙이기" : "💬 댓글"} · {item.createdAt ? formatKST(item.createdAt) : ""}
              </Text>

              {item.type === "attach" ? (
                <>
                  <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={1}>
                    {item.attachedTitle ?? "(제목 없음)"}
                  </Text>
                  {!!item.attachedSnippet && (
                    <Text style={[typography.bodySmall, { color: colors.text.secondary }]} numberOfLines={2}>
                      {item.attachedSnippet}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={3}>
                  {item.body}
                </Text>
              )}

              <View style={{ flexDirection: "row", columnGap: spacing.sm, marginTop: spacing.sm }}>
                <Button
                  title="상세로"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/post/${item.postId}` as any)}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </View>
  );
}
