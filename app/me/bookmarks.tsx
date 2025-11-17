// app/me/bookmarks.tsx
import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { listenMyBookmarks } from "../../src/lib/bookmarks";
import { getPost, Post } from "../../src/lib/posts";
import PostItem from "../../src/components/PostItem";
import { useTheme } from "../../src/contexts/ThemeContext";
import AppHeader from "../../src/components/AppHeader";

export default function MyBookmarksScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenMyBookmarks((postIds) => {
      setBookmarkedPostIds(postIds);
      setLoading(true);
      
      // 각 postId로 Post 데이터 가져오기
      const postPromises = postIds.map(id => 
        new Promise<Post | null>((resolve) => {
          let resolved = false;
          const unsubPost = getPost(id, (post) => {
            if (!resolved) {
              resolved = true;
              unsubPost();
              resolve(post);
            }
          });
          
          // 타임아웃 (5초 후 null 반환)
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              unsubPost();
              resolve(null);
            }
          }, 5000);
        })
      );
      
      Promise.all(postPromises).then((results) => {
        setPosts(results.filter((p): p is Post => p !== null));
        setLoading(false);
      });
    });
    
    return () => unsub();
  }, []);

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['4xl'],
    }}>
      <Text style={{ fontSize: 60, marginBottom: spacing.lg }}>📑</Text>
      <Text style={[typography.h3, { 
        color: colors.text.primary, 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }]}>
        북마크한 글이 없어요
      </Text>
      <Text style={[typography.body, { 
        color: colors.text.secondary, 
        textAlign: 'center'
      }]}>
        관심 있는 글을 북마크해서{'\n'}나중에 다시 볼 수 있어요
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="북마크" />
      {loading && bookmarkedPostIds.length > 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.md }]}>
            북마크한 글을 불러오는 중...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostItem post={item} mode="light" />}
          contentContainerStyle={{ 
            padding: spacing.lg,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

