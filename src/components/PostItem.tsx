import React from 'react';
import { View, Text, Pressable, Image } from "react-native";
import { Link } from "expo-router";
import { Post } from "../lib/posts";
import { formatKST } from "../lib/datetime";
import { colors, typography, spacing, borderRadius } from "../styles/theme";
import Card from "./common/Card";

interface PostItemProps {
  post: Post;
  mode?: 'light' | 'detailed';
}

export default function PostItem({ post, mode = 'light' }: PostItemProps) {
  const created = formatKST(post.createdAt);

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
            {/* 썸네일 자리 + 제목 */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              {/* 썸네일 자리 (향후 이미지 추가 예정) */}
              <View style={{
                width: 60,
                height: 60,
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
                marginRight: spacing.md,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.gray[200],
              }}>
                <Text style={{ fontSize: 24 }}>😅</Text>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text 
                  style={[typography.h4, { color: colors.text.primary }]} 
                  numberOfLines={2}
                >
                  {post.title}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {created}
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

            {/* 통계 */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  ❤️ {post.likeCount ?? 0}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  💬 {post.commentCount ?? 0}
                </Text>
              </View>
              <Text style={[typography.small, { color: colors.text.disabled }]}>
                자세히 보기 →
              </Text>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
            <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]} numberOfLines={2}>
              {post.title}
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
              {created}
            </Text>
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
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: spacing.xs }}>❤️</Text>
                <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                  {post.likeCount ?? 0}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: spacing.xs }}>💬</Text>
                <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                  {post.commentCount ?? 0}
                </Text>
              </View>
            </View>
            <Text style={[typography.bodySmall, { color: colors.accent }]}>
              자세히 보기 →
            </Text>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
