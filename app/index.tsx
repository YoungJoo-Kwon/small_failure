import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, RefreshControl, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { listenFeedPaginated, loadNextPage, Post } from "../src/lib/posts";
import PostItem from "../src/components/PostItem";
import Button from "../src/components/common/Button";
import { useTheme } from "../src/contexts/ThemeContext";
import { useOnboarding } from "../src/contexts/OnboardingContext";
// import { ensureProfileSeed } from "../src/lib/profiles";
// import { formatKST } from "../src/lib/datetime";
// import Card from "../src/components/common/Card";
import AppHeader from "../src/components/AppHeader";

/** 간단 정렬 모드 타입 */
type SortMode = "latest" | "mostLiked";
/** 글머리 필터 타입 */
type RequestTypeFilter = "공감구함" | "조언구함" | "혼쭐내줘" | null;

export default function FeedScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { resetOnboarding } = useOnboarding();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastPost, setLastPost] = useState<Post | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("latest"); // ✅ 정렬 모드 추가
  const [requestTypeFilter, setRequestTypeFilter] = useState<RequestTypeFilter>(null); // ✅ 글머리 필터

  // 초기 로드 (페이지네이션)
  useEffect(() => {
    const unsub = listenFeedPaginated((newPosts) => {
      setPosts(newPosts);
      if (newPosts.length > 0) {
        setLastPost(newPosts[newPosts.length - 1]);
      }
      // 20개 미만이면 더 이상 데이터 없음
      setHasMore(newPosts.length >= 20);
    });
    return () => unsub();
  }, []);

  useFocusEffect(() => {
    setRefreshing(false);
  });

  const handleRefresh = () => {
    setRefreshing(true);
    // 페이지네이션 리셋
    setPosts([]);
    setLastPost(null);
    setHasMore(true);
    // 짧은 딜레이 후 상태 해제 (실제 데이터 로딩 시간 고려)
    setTimeout(() => setRefreshing(false), 1500);
  };

  // 다음 페이지 로드
  const loadMore = async () => {
    // 최신순일 때만 페이지네이션 (공감순은 클라이언트 정렬이므로 모든 데이터 필요)
    if (sortMode !== "latest" || !hasMore || loadingMore || !lastPost) return;
    
    setLoadingMore(true);
    try {
      const nextPosts = await loadNextPage(lastPost);
      if (nextPosts.length > 0) {
        setPosts((prev) => [...prev, ...nextPosts]);
        setLastPost(nextPosts[nextPosts.length - 1]);
        setHasMore(nextPosts.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("[FeedScreen] loadMore failed:", e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // 스크롤 끝 감지
  const handleEndReached = () => {
    if (sortMode === "latest") {
      loadMore();
    }
  };

  /** 정렬된 데이터 메모 */
  const sortedPosts = useMemo(() => {
    let result = posts;
    
    // 글머리 필터 적용
    if (requestTypeFilter) {
      result = result.filter(post => (post.requestType ?? "공감구함") === requestTypeFilter);
    }
    
    // 정렬
    if (sortMode === "mostLiked") {
      // 공감순: likeCount 내림차순, 동률이면 createdAt 내림차순
      // 공감순일 때는 모든 데이터를 클라이언트에서 정렬하므로 페이지네이션 비활성화
      return [...result].sort((a, b) => {
        const la = a.likeCount ?? 0;
        const lb = b.likeCount ?? 0;
        if (lb !== la) return lb - la;
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
    }
    // 최신순: createdAt 내림차순 (이미 서버에서 정렬됨)
    return result;
  }, [posts, sortMode, requestTypeFilter]);

  // 정렬 모드 또는 필터 변경 시 페이지네이션 리셋
  useEffect(() => {
    if (sortMode === "mostLiked" || requestTypeFilter !== null) {
      // 공감순이거나 필터 적용 시 모든 데이터 필요하므로 페이지네이션 비활성화
      setHasMore(false);
    } else {
      // 최신순이고 필터 없을 때만 페이지네이션 활성화
      setHasMore(true);
    }
  }, [sortMode, requestTypeFilter]);

  const renderEmptyState = () => {
    // 인기 태그 (탐색 페이지의 태그 카테고리에서 가져옴)
    const popularTags = ["시험", "프로젝트", "인간관계", "시간관리", "커뮤니케이션", "업무"];

    const handleTagPress = (tag: string) => {
      router.push(`/explore?tag=${tag}` as any);
    };

    const handleOnboardingPress = async () => {
      await resetOnboarding();
      router.push('/onboarding');
    };

    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
      }}>
        {/* 메인 메시지 */}
        <Text style={{ fontSize: 60, marginBottom: spacing.lg }}>😅</Text>
        <Text style={[typography.h3, { 
          color: colors.text.primary, 
          textAlign: 'center',
          marginBottom: spacing.sm 
        }]}>
          아직 실패담이 없어요
        </Text>
        <Text style={[typography.body, { 
          color: colors.text.secondary, 
          textAlign: 'center',
          marginBottom: spacing.xl 
        }]}>
          첫 번째 실패담을 공유해보세요!{'\n'}함께 성장해갈 수 있어요 🚀
        </Text>

        {/* 주요 액션 버튼 */}
        <Link href="/new" asChild>
          <Button 
            title="✍️ 첫 실패담 쓰기" 
            variant="primary"
            size="lg"
            style={{ marginBottom: spacing.md, width: '100%' }}
            onPress={() => {}}
          />
        </Link>

        {/* 인기 태그 섹션 */}
        <View style={{ width: '100%', marginTop: spacing.xl, marginBottom: spacing.lg }}>
          <Text style={[typography.bodySmall, { 
            color: colors.text.secondary, 
            textAlign: 'center',
            marginBottom: spacing.sm 
          }]}>
            이런 실패담들이 있어요
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: spacing.sm 
          }}>
            {popularTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.secondary,
                  borderWidth: 1,
                  borderColor: colors.gray[200],
                }}
              >
                <Text style={[typography.caption, { color: colors.text.primary }]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/explore')}
            style={{ marginTop: spacing.sm }}
          >
            <Text style={[typography.bodySmall, { 
              color: colors.accent, 
              textAlign: 'center',
              textDecorationLine: 'underline'
            }]}>
              더 많은 태그 탐색하기 →
            </Text>
          </TouchableOpacity>
        </View>

        {/* 온보딩 다시 보기 */}
        <TouchableOpacity
          onPress={handleOnboardingPress}
          style={{ marginTop: spacing.lg }}
        >
          <Text style={[typography.caption, { 
            color: colors.text.secondary,
            textAlign: 'center'
          }]}>
            앱 사용법 다시 보기
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /** 헤더 안에 들어갈 정렬 토글 UI (간단 세그먼트) */
  const SortToggle = () => (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[
        { key: "latest", label: "🕒 최신순" },
        { key: "mostLiked", label: "💗 공감순" },
      ].map(({ key, label }) => {
        const active = sortMode === (key as SortMode);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setSortMode(key as SortMode)}
            style={{
              backgroundColor: active ? colors.accent : colors.background.light,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.gray[200],
            }}
          >
            <Text
              style={[
                typography.bodySmall,
                { color: active ? colors.text.inverse : colors.text.secondary, fontWeight: active ? '700' : '500' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /** 글머리 필터 UI */
  const RequestTypeFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: spacing.sm }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
        <TouchableOpacity
          onPress={() => setRequestTypeFilter(null)}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: requestTypeFilter === null ? colors.accent : colors.background.light,
            borderWidth: 1,
            borderColor: requestTypeFilter === null ? colors.accent : colors.gray[200],
          }}
        >
          <Text style={[typography.caption, { 
            color: requestTypeFilter === null ? colors.text.inverse : colors.text.secondary,
            fontWeight: requestTypeFilter === null ? '700' : '500'
          }]}>
            전체
          </Text>
        </TouchableOpacity>
        {(["공감구함", "조언구함", "혼쭐내줘"] as const).map((type) => {
          const active = requestTypeFilter === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setRequestTypeFilter(type)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                backgroundColor: active ? colors.accent : colors.background.light,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.gray[200],
              }}
            >
              <Text style={[typography.caption, { 
                color: active ? colors.text.inverse : colors.text.secondary,
                fontWeight: active ? '700' : '500'
              }]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader subtitle="당신의 실패를 응원합니다">
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            flexWrap: 'wrap'
          }}>
            <View style={{ flexShrink: 1 }}>
              <SortToggle />
            </View>
            <Link href="/new" asChild>
              <Button
                title="✍️ 글쓰기"
                size="sm"
                style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
              />
            </Link>
          </View>
          <RequestTypeFilter />
        </View>
      </AppHeader>

      <FlatList
        data={sortedPosts}  // ✅ 정렬된 데이터 사용
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem post={item} mode="light" />}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5} // 스크롤 끝에서 50% 전에 로드
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accent} />
              <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                더 불러오는 중...
              </Text>
            </View>
          ) : !hasMore && posts.length > 0 ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                모든 글을 불러왔어요
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ 
          padding: spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
