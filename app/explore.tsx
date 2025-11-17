import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, RefreshControl, Keyboard } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../src/contexts/ThemeContext";
import Button from "../src/components/common/Button";
import Card from "../src/components/common/Card";
import PostItem from "../src/components/PostItem";
import { searchByTag, searchPostsByTitlePrefix, Post } from "../src/lib/posts";
import AppHeader from "../src/components/AppHeader";

const tagCategories = [
  { label: "학업 · 시험", tags: ["시험", "학업", "자격증"] },
  { label: "취업 · 커리어", tags: ["취업", "이직", "프로젝트", "업무"] },
  { label: "관계 · 커뮤니케이션", tags: ["인간관계", "팀워크", "소통"] },
  { label: "건강 · 멘탈", tags: ["멘탈", "건강", "번아웃"] },
  { label: "라이프 · 재정", tags: ["재정", "습관", "생활"] },
];

export default function ExploreScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tag?: string }>();

  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<() => void>();

  const clearSubscription = () => {
    if (typeof unsubRef.current === "function") {
      unsubRef.current();
      unsubRef.current = undefined;
    }
  };

  useEffect(() => {
    return () => clearSubscription();
  }, []);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setSelectedTag(null);

    clearSubscription();
    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    unsubRef.current = searchPostsByTitlePrefix(value.trim(), (posts) => {
      setResults(posts);
      setLoading(false);
    });
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setKeyword("");
    clearSubscription();

    setLoading(true);
    unsubRef.current = searchByTag(tag, (posts) => {
      setResults(posts);
      setLoading(false);
    });
  };

  // URL 쿼리 파라미터에서 태그 받기
  useEffect(() => {
    if (params.tag) {
      handleSelectTag(params.tag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tag]);

  const sectionTitle = useMemo(() => {
    if (selectedTag) return `#${selectedTag} 실패 모음`;
    if (keyword.trim().length > 0) return `"${keyword}" 검색 결과`;
    return "추천 태그로 시작해보세요";
  }, [keyword, selectedTag]);

  const tagInsights = useMemo(() => {
    if (!results.length) return [];
    const map: Record<string, { count: number; likes: number; comments: number }> = {};
    results.forEach((post) => {
      post.tags?.forEach((tag) => {
        if (!map[tag]) map[tag] = { count: 0, likes: 0, comments: 0 };
        map[tag].count += 1;
        map[tag].likes += post.likeCount ?? 0;
        map[tag].comments += post.commentCount ?? 0;
      });
    });
    return Object.entries(map)
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        avgLike: data.count ? Math.round(data.likes / data.count) : 0,
        avgComment: data.count ? Math.round(data.comments / data.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [results]);

  const seriesSuggestions = useMemo(() => {
    if (!results.length) return [];
    const grouped: Record<string, Post[]> = {};
    results.forEach((post) => {
      const key = post.tags?.[0] ?? "기타";
      if (!grouped[key]) grouped[key] = [];
      if (grouped[key].length < 3) {
        grouped[key].push(post);
      }
    });
    return Object.entries(grouped).slice(0, 3);
  }, [results]);

  const summary = useMemo(() => {
    if (!results.length) return null;

    let totalLikes = 0;
    let totalComments = 0;
    const tagCounts: Record<string, number> = {};

    results.forEach((post) => {
      totalLikes += post.likeCount ?? 0;
      totalComments += post.commentCount ?? 0;
      post.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      });
    });

    const topTag = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      total: results.length,
      avgLike: Math.round(totalLikes / results.length),
      avgComment: Math.round(totalComments / results.length),
      topTag,
    };
  }, [results]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="탐색" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (selectedTag) {
                handleSelectTag(selectedTag);
              } else if (keyword.trim()) {
                handleSearch(keyword);
              }
            }}
            tintColor={colors.accent}
          />
        }
      >
        {/* 검색 헤더 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.h2, { color: colors.text.primary }]}>탐색</Text>
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: spacing.xs }]}>
            비슷한 실패와 시리즈를 찾아보세요.
          </Text>
        </View>

        <Card padding="lg" style={{ marginBottom: spacing.lg }}>
          <TextInput
            placeholder="키워드로 실패담 검색"
            value={keyword}
            onChangeText={handleSearch}
            onSubmitEditing={() => Keyboard.dismiss()}
            style={{
              borderWidth: 1,
              borderColor: colors.gray[300],
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              color: colors.text.primary,
              backgroundColor: colors.background.light,
            }}
            placeholderTextColor={colors.gray[400]}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
              {selectedTag ? `#${selectedTag}` : keyword ? "키워드 검색" : "추천 태그"}
            </Text>
            {selectedTag && (
              <TouchableOpacity onPress={() => { setSelectedTag(null); setResults([]); }}>
                <Text style={[typography.bodySmall, { color: colors.accent }]}>초기화</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* 태그 브라우저 */}
        {!keyword && !selectedTag && (
          <View style={{ marginBottom: spacing.xl }}>
            {tagCategories.map((group) => (
              <View key={group.label} style={{ marginBottom: spacing.md }}>
                <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                  {group.label}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {group.tags.map((tag) => {
                    const active = selectedTag === tag;
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => handleSelectTag(tag)}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: borderRadius.full,
                          backgroundColor: active ? colors.accent : colors.background.light,
                          borderWidth: 1,
                          borderColor: active ? colors.accent : colors.gray[200],
                        }}
                      >
                        <Text style={[typography.bodySmall, { color: active ? colors.text.inverse : colors.text.primary }]}>
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 결과 */}
        <View style={{ marginBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[typography.h4, { color: colors.text.primary }]}>{sectionTitle}</Text>
          {(keyword || selectedTag) && (
            <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
              {results.length}개의 실패
            </Text>
          )}
        </View>

        {summary && (
          <Card padding="lg" style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>총 글</Text>
                <Text style={[typography.h3, { color: colors.text.primary }]}>{summary.total}</Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>평균 공감</Text>
                <Text style={[typography.body, { color: colors.text.primary }]}>{summary.avgLike}</Text>
              </View>
              <View>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>평균 댓글</Text>
                <Text style={[typography.body, { color: colors.text.primary }]}>{summary.avgComment}</Text>
              </View>
            </View>
            {summary.topTag && (
              <TouchableOpacity onPress={() => handleSelectTag(summary.topTag)}>
                <Text style={[typography.bodySmall, { color: colors.accent, marginTop: spacing.sm }]}>
                  가장 많이 등장한 태그 #{summary.topTag} 바로 보기 →
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {results.length === 0 && (keyword || selectedTag) ? (
          <Card>
            <Text style={[typography.body, { color: colors.text.secondary }]}>
              아직 관련 실패가 없어요. 새로운 기록을 남겨보세요!
            </Text>
            <Button
              title="새 실패 기록하기"
              size="sm"
              style={{ marginTop: spacing.sm, backgroundColor: colors.accent, borderColor: colors.accent }}
              onPress={() => router.push("/new")}
            />
          </Card>
        ) : (
          <>
            <FlatList
              data={results}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostItem post={item} mode="light" />}
              ListFooterComponent={<View style={{ height: spacing.lg }} />}
            />

            {tagInsights.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                  태그 인사이트
                </Text>
                <Card padding="lg" style={{ gap: spacing.md }}>
                  {tagInsights.map((insight) => (
                    <TouchableOpacity
                      key={insight.tag}
                      onPress={() => handleSelectTag(insight.tag)}
                      style={{
                        padding: spacing.sm,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.gray[200],
                        backgroundColor: colors.background.light,
                      }}
                    >
                      <Text style={[typography.body, { color: colors.text.primary, marginBottom: 2 }]}>
                        #{insight.tag}
                      </Text>
                      <Text style={[typography.caption, { color: colors.text.secondary }]}>
                        {insight.count}개의 실패 · 평균 공감 {insight.avgLike} · 평균 댓글 {insight.avgComment}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Card>
              </View>
            )}

            {seriesSuggestions.length > 0 && (
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                  추천 시리즈 미리보기
                </Text>
                {seriesSuggestions.map(([tag, posts]) => (
                  <Card key={tag} padding="lg" style={{ marginBottom: spacing.md }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                      <Text style={[typography.body, { color: colors.text.primary }]}>#{tag} 시리즈</Text>
                      <Button title="모두 보기" size="sm" variant="secondary" onPress={() => handleSelectTag(tag)} />
                    </View>
                    {posts.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        onPress={() => router.push(`/post/${post.id}` as any)}
                        style={{ marginBottom: spacing.xs }}
                      >
                        <Text style={[typography.bodySmall, { color: colors.text.primary }]} numberOfLines={1}>
                          • {post.title}
                        </Text>
                        <Text style={[typography.caption, { color: colors.text.secondary }]} numberOfLines={1}>
                          {post.lessons}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

