import React, { useEffect, useState } from "react";
import { View, FlatList, RefreshControl, Text, TouchableOpacity } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { listenFeed, Post } from "../src/lib/posts";
import PostItem from "../src/components/PostItem";
import ModeToggle, { ViewMode } from "../src/components/common/ModeToggle";
import Button from "../src/components/common/Button";
import { colors, typography, spacing } from "../src/styles/theme";

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('light');

  useEffect(() => {
    const unsub = listenFeed(setPosts);
    return () => unsub();
  }, []);

  useFocusEffect(() => {
    setRefreshing(false);
  });

  const handleRefresh = () => {
    setRefreshing(true);
    // 실제로는 데이터를 다시 로드하는 로직이 필요
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing['4xl'],
      paddingVertical: spacing['5xl'],
    }}>
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
      <Link href="/new" asChild>
        <Button 
          title="첫 실패담 쓰기" 
          variant="primary"
          size="lg"
          onPress={() => {}}
        />
      </Link>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      {/* 헤더 */}
      <View style={{
        backgroundColor: colors.background.light,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <View>
            <Text style={[typography.h2, { color: colors.text.primary }]}>
              작은 실패 갤러리
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
              당신의 실패를 응원합니다
            </Text>
          </View>
          <Link href="/new" asChild>
            <TouchableOpacity style={{
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 20,
            }}>
              <Text style={[typography.bodySmall, { color: colors.text.inverse, fontWeight: '600' }]}>
                ✍️ 글쓰기
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        
        {/* 모드 토글 */}
        <ModeToggle 
          mode={viewMode} 
          onModeChange={setViewMode}
        />
      </View>

      {/* 피드 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem post={item} mode={viewMode} />}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
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
