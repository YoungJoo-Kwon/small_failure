import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, TouchableOpacity, Alert } from "react-native";
import { Link } from "expo-router";
import { Post, toggleLikeRobust } from "../lib/posts";
import { formatKST } from "../lib/datetime";
import { useTheme } from "../contexts/ThemeContext";
import Card from "./common/Card";
import Avatar from "./Avatar";
import { listenMyLike } from "../lib/likes";
import { toggleBookmark, listenBookmarkStatus } from "../lib/bookmarks";
import { Ionicons } from "@expo/vector-icons";

interface PostItemProps {
  post: Post;
  mode?: 'light' | 'detailed';
}

export default function PostItem({ post, mode = 'light' }: PostItemProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const created = formatKST(post.createdAt);
  const head = post.requestType ?? "공감구함";
  const headLabel = `[${head}] `;

  // 공감 상태
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);

  // 북마크 상태
  const [bookmarked, setBookmarked] = useState(false);

  // 공감 상태 구독
  useEffect(() => {
    if (!post.id) return;
    const unsub = listenMyLike(post.id, setLiked);
    return () => unsub();
  }, [post.id]);

  // 북마크 상태 구독
  useEffect(() => {
    if (!post.id) return;
    const unsub = listenBookmarkStatus(post.id, setBookmarked);
    return () => unsub();
  }, [post.id]);

  // 공감 버튼 핸들러
  const handleLike = async (e: any) => {
    e?.stopPropagation?.();
    if (!post.id) return;
    
    const prevLiked = liked;
    const prevCount = likeCount;
    
    // 낙관적 업데이트
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    try {
      await toggleLikeRobust(post.id);
      // 상태는 실시간 구독으로 자동 업데이트됨
    } catch (e) {
      console.error("Like failed:", e);
      // 에러 시 원래 상태로 복구
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  // 북마크 버튼 핸들러
  const handleBookmark = async (e: any) => {
    e?.stopPropagation?.();
    if (!post.id) return;
    
    try {
      await toggleBookmark(post.id);
      // 상태는 실시간 구독으로 자동 업데이트됨
    } catch (e) {
      console.error("Bookmark failed:", e);
      Alert.alert("오류", "북마크 처리에 실패했습니다.");
    }
  };

  if (mode === 'light') {
    return (
      <Link href={`/post/${post.id}`} asChild>
        <Pressable>
          <Card
            style={{
              marginBottom: spacing.md,
              backgroundColor: colors.background.card,
            }}
            onPress={() => {}}
          >
            {/* 작성자 아바타 + 제목 */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              {/* 작성자 아바타 */}
              <Avatar 
                authorId={post.authorId}
                snapshotAvatarUrl={post.authorAvatarUrl}
                size={50}
                style={{
                  marginRight: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.gray[300],
                }}
              />
              
              <View style={{ flex: 1 }}>
                <Text 
                  style={[typography.h4, { color: colors.text.primary }]} 
                  numberOfLines={2}
                >
                  {headLabel}{post.title}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                  {post.authorNickname ?? "익명의 실패러"} · {created}
                </Text>
              </View>
            </View>

            {/* 본문 (짧게) */}
            <Text 
              numberOfLines={2} 
              style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.sm }]}
            >
              {post.body}
            </Text>

            {/* 교훈 한 줄 */}
            {post.lessons && (
              <View style={{
                backgroundColor: colors.surface,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                marginBottom: spacing.sm,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent,
              }}>
                <Text style={[typography.lesson, { color: colors.text.accent }]}>
                  💡 {post.lessons}
                </Text>
              </View>
            )}

            {/* 태그 (최대 3개) */}
            {post.tags && post.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm }}>
                {post.tags.slice(0, 3).map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.secondary,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                      marginRight: spacing.xs,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Text style={[typography.caption, { color: colors.text.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 통계 및 액션 버튼 */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={handleLike}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                >
                  <Ionicons 
                    name={liked ? "heart" : "heart-outline"} 
                    size={18} 
                    color={liked ? (colors.error || "#f87171") : colors.text.secondary} 
                  />
                  <Text style={[typography.caption, { 
                    color: liked ? (colors.error || "#f87171") : colors.text.secondary 
                  }]}>
                    {likeCount}
                  </Text>
                </TouchableOpacity>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  💬 {post.commentCount ?? 0}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <TouchableOpacity onPress={handleBookmark}>
                  <Ionicons 
                    name={bookmarked ? "bookmark" : "bookmark-outline"} 
                    size={18} 
                    color={bookmarked ? colors.accent : colors.text.secondary} 
                  />
                </TouchableOpacity>
                <Text style={[typography.small, { color: colors.text.disabled }]}>
                  자세히 보기 →
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      </Link>
    );
  }

  // detailed 모드
  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable>
        <Card
          style={{
            marginBottom: spacing.lg,
            backgroundColor: colors.background.card,
          }}
          onPress={() => {}}
        >
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}>
            {/* 작성자 아바타 */}
            <Avatar 
              authorId={post.authorId}
              snapshotAvatarUrl={post.authorAvatarUrl}
              size={40}
              style={{
                marginRight: spacing.sm,
                borderWidth: 1,
                borderColor: colors.gray[300],
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text.primary }]} numberOfLines={2}>
                {headLabel}{post.title}
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                {post.authorNickname ?? "익명의 실패러"} · {created}
              </Text>
            </View>
          </View>

          {/* 본문 */}
          <Text 
            style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 24 }]}
            numberOfLines={3}
          >
            {post.body}
          </Text>

          {/* 교훈 섹션 */}
          {post.lessons && (
            <View style={{
              backgroundColor: colors.surface,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: colors.accent,
            }}>
              <Text style={[typography.bodySmall, { color: colors.text.accent, fontWeight: '600' }]}>
                🎯 핵심 교훈
              </Text>
              <Text style={[typography.quote, { color: colors.text.accent, marginTop: spacing.xs }]}>
                {post.lessons}
              </Text>
            </View>
          )}

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
              {post.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.secondary,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.full,
                    marginRight: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={[typography.bodySmall, { color: colors.text.primary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 이미지 미리보기 */}
          {post.imageUrl && (
            <View style={{ marginBottom: spacing.md }}>
              <Image
                source={{ uri: post.imageUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: borderRadius.md,
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* 푸터 */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.gray[200],
          }}>
            <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={handleLike}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
              >
                <Ionicons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={18} 
                  color={liked ? (colors.error || "#f87171") : colors.text.secondary} 
                />
                <Text style={[typography.bodySmall, { 
                  color: liked ? (colors.error || "#f87171") : colors.text.secondary 
                }]}>
                  {likeCount}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: spacing.xs }}>💬</Text>
                <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                  {post.commentCount ?? 0}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <TouchableOpacity onPress={handleBookmark}>
                <Ionicons 
                  name={bookmarked ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={bookmarked ? colors.accent : colors.text.secondary} 
                />
              </TouchableOpacity>
              <Text style={[typography.bodySmall, { color: colors.accent }]}>
                자세히 보기 →
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
