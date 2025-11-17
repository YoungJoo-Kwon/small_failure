import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, RefreshControl } from "react-native";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useRouter } from "expo-router";
import Card from "../../src/components/common/Card";
import Button from "../../src/components/common/Button";
import AppHeader from "../../src/components/AppHeader";
import { ensureAnonSignIn } from "../../src/lib/auth";
import { ensureProfileSeed } from "../../src/lib/profiles";
import { listenMyPosts } from "../../src/lib/userContent";
import type { Post } from "../../src/lib/posts";

export default function GrowthNotesScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: any;
    (async () => {
      try {
        await ensureAnonSignIn();
        await ensureProfileSeed();
        unsub = listenMyPosts((items) => setPosts(items.filter((p) => !!p.lessons)));
      } catch (e: any) {
        Alert.alert("오류", e?.message ?? "성장 노트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub && unsub();
  }, []);

  const notes = posts
    .filter((p) => p.lessons)
    .map((p) => ({
      id: p.id,
      title: p.title,
      lessons: p.lessons,
      tags: p.tags ?? [],
      createdAt: p.createdAt,
    }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="성장 노트" subtitle="내가 적은 교훈 문장을 모아보세요." />
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <Card>
              <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                아직 작성한 교훈이 없어요. 실패 기록을 남기면 성장 노트가 쌓여요.
              </Text>
              <Button title="첫 기록 남기기" onPress={() => router.push("/new")} />
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
            <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
              {item.tags?.slice(0, 2).map((t) => `#${t}`).join(" ")}
            </Text>
            <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.xs }]}>
              {item.lessons}
            </Text>
            {item.title ? (
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]} numberOfLines={1}>
                ↳ {item.title}
              </Text>
            ) : null}
          </Card>
        )}
      />
    </View>
  );
}

