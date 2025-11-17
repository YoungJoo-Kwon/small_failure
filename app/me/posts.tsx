// app/me/posts.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import Card from "../../src/components/common/Card";
import Button from "../../src/components/common/Button";
import AppHeader from "../../src/components/AppHeader";

import { ensureAnonSignIn } from "../../src/lib/auth";
import { ensureProfileSeed } from "../../src/lib/profiles";
import { listenMyPosts } from "../../src/lib/userContent";
import { formatKST } from "../../src/lib/datetime";
import type { Post } from "../../src/lib/posts";
import { setPostVisibility } from "../../src/lib/posts";

type VisibilityFilter = "all" | "public" | "private";

export default function MyPostsScreen() {
  const router = useRouter();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VisibilityFilter>("all");

  useEffect(() => {
    let unsub: any;
    (async () => {
      try {
        await ensureAnonSignIn();
        await ensureProfileSeed("익명의 실패러");
        unsub = listenMyPosts(setItems, (e) => console.error("listenMyPosts:", e));
      } catch (e:any) {
        Alert.alert("오류", e?.message ?? "내 글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub && unsub();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    const visibility = item.visibility ?? "public";
    return visibility === filter;
  });

  const counts = {
    all: items.length,
    public: items.filter((item) => (item.visibility ?? "public") === "public").length,
    private: items.filter((item) => (item.visibility ?? "public") === "private").length,
  };

  const handleToggleVisibility = async (post: Post, nextVisible: boolean) => {
    const next = nextVisible ? "public" : "private";
    const prevVisibility = post.visibility ?? "public";
    setItems((prev) =>
      prev.map((item) =>
        item.id === post.id ? { ...item, visibility: next } : item
      )
    );
    try {
      await ensureAnonSignIn();
      await setPostVisibility(post.id, next);
    } catch (e: any) {
      // revert optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, visibility: prevVisibility } : item
        )
      );
      console.error("setPostVisibility failed:", e);
      Alert.alert("오류", e?.message ?? "공개 설정을 바꾸지 못했습니다.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="내 글" subtitle="내가 남긴 실패담을 한눈에 확인하세요." />
      <View style={{ flex: 1, padding: spacing.lg }}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          {([
            { key: "all", label: `전체 ${counts.all}` },
            { key: "public", label: `공개 ${counts.public}` },
            { key: "private", label: `비공개 ${counts.private}` },
          ] as const).map(({ key, label }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: active ? colors.accent : colors.background.light,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.gray[200],
                }}
              >
                <Text style={[typography.caption, { color: active ? colors.text.inverse : colors.text.primary, fontWeight: active ? "700" : "500" }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.md }]}>
              작성한 모든 실패담 기록입니다.
            </Text>
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                {filter === "private"
                  ? "비공개 글이 없어요. 공개 글을 비공개로 전환하면 여기서 볼 수 있어요."
                  : filter === "public"
                    ? "공개된 글이 아직 없어요. 실패담을 작성하고 공개로 두면 피드에 공유돼요."
                    : "아직 작성한 글이 없어요. 첫 실패담을 공유해보세요!"}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.md }}>
              <Card style={{ padding: spacing.md, backgroundColor: colors.background.light }}>
                <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title}
                </Text>

                {/* 작성자 닉네임/작성일 */}
                <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                  {item.authorNickname ?? "익명의 실패러"} · {item.createdAt ? formatKST(item.createdAt) : ""}
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {(item.visibility ?? "public") === "public" ? "공개" : "비공개"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", columnGap: spacing.xs }}>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {(item.visibility ?? "public") === "public" ? "On" : "Off"}
                    </Text>
                    <Switch
                      value={(item.visibility ?? "public") === "public"}
                      onValueChange={(next) => handleToggleVisibility(item, next)}
                      trackColor={{ false: colors.gray[300], true: colors.accent }}
                      thumbColor={(item.visibility ?? "public") === "public" ? colors.primary : colors.gray[100]}
                    />
                  </View>
                </View>

                {/* 메타 */}
                <View style={{ flexDirection: "row", columnGap: spacing.md, marginTop: spacing.xs, alignItems: "center" }}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    공감 {item.likeCount ?? 0}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    댓글 {item.commentCount ?? 0}
                  </Text>
                  {!!item.attachCount && (
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      붙이기 {item.attachCount}
                    </Text>
                  )}
                  <View style={{ flex: 1 }} />
                  <Button
                    title="상세 보기"
                    size="sm"
                    variant="secondary"
                    onPress={() => router.push(`/post/${item.id}` as any)}
                  />
                </View>
              </Card>
            </View>
          )}
        />

        <View style={{ marginTop: spacing.md }}>
          <Button title="새 글 쓰기" onPress={() => router.push("/new")} />
        </View>
      </View>
    </View>
  );
}
