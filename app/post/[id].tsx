// app/post/[id].tsx
import { useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { auth } from "../../src/lib/firebase";
//import { deletePostAndComments, toggleLikeRobust } from "../../src/lib/posts";
import { useRouter } from "expo-router";
import { ensureAnonSignIn } from "../../src/lib/auth";

import { formatKST } from "../../src/lib/datetime";              // ⬅️ ① 작성 일시 포맷 유틸
import {
  getPost,           // 실시간 구독
  toggleLikeRobust,        // 공감
  addComment,        // 댓글 등록
  reportPost,        // 신고
  Post, 
  deletePostAndComments,
  Comment
} from "../../src/lib/posts";

import Button from "../../src/components/common/Button";
import { colors, typography, spacing, borderRadius } from "../../src/styles/theme";

const router = useRouter();

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = getPost(id as string, (p, c) => {
      setPost(p);
      setComments(c);
    });
    return () => unsub && unsub();
  }, [id]);

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.surface, padding: spacing.lg }}>
        <Text style={[typography.body]}>불러오는 중...</Text>
      </View>
    );
  }

  // ⬅️ ① 작성 일시 문자열 (서울/KST)
  const createdLabel = formatKST(post.createdAt);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface, padding: spacing.lg, gap: spacing.md }}>
      {/* 제목 */}
      <Text style={[typography.h3, { color: colors.text.primary }]}>{post.title}</Text>

      {/* ⬅️ ① 작성 일시 표시 (제목 아래) */}
      <Text style={[typography.caption, { color: colors.text.secondary }]}>작성: {createdLabel}</Text>

      {/* ⬅️ ③ 본문 가독성 개선: 줄간, 여백, 색상 */}
      <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 22, marginTop: spacing.sm }]}>
        {post.body}
      </Text>

      {/* 배운 점 강조 */}
      <View style={{
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
      }}>
        <Text style={[typography.bodySmall, { color: colors.text.accent, fontWeight: '600' }]}>🎯 핵심 교훈</Text>
        <Text style={[typography.quote, { color: colors.text.accent, marginTop: spacing.xs }]}>
          {post.lessons}
        </Text>
      </View>

      {/* ⬅️ ② 태그 배지 (있을 때만) */}
      {post.tags?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
          {post.tags.map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                backgroundColor: colors.secondary
              }}
            >
              <Text style={[typography.caption, { color: colors.text.primary }]}>#{t}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 메타: 공감/댓글 수 */}
      <Text style={[typography.caption, { marginTop: spacing.xs, color: colors.text.secondary }]}>
        공감 {post.likeCount ?? 0} · 댓글 {post.commentCount ?? 0}
      </Text>

      {/* 공감 & 신고 버튼 */}
      <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginTop: spacing.xs }}>
        <Button title="공감" size="sm" style={{ backgroundColor: colors.accent, borderColor: colors.accent }} onPress={async () => {
          try {
            await ensureAnonSignIn();             // ✅
            await toggleLikeRobust(post.id);
          } catch (e:any) {
            console.error(e);
             Alert.alert("오류", e?.message ?? "공감 실패");
          }
        }} />
        <Button
          title="신고"
          variant="secondary"
          size="sm"
          onPress={async () => {
            try {
              await ensureAnonSignIn();
              await reportPost(post.id, "부적절한 내용");
              Alert.alert("신고 접수되었습니다.");
            } catch (e:any) {
              Alert.alert("오류", e?.message ?? "신고 실패");
            }
          }}
        />

        <Button
          title="붙이기"
          size="sm"
          style={{ backgroundColor: colors.secondary, borderColor: colors.secondary }}
          onPress={() => {
            Alert.alert("붙이기", "이 실패담을 다른 실패담과 연결하시겠습니까?", [
              { text: "취소", style: "cancel" },
              { text: "붙이기", onPress: () => {
                // 향후 붙이기 기능 구현 예정
                Alert.alert("알림", "붙이기 기능은 준비 중입니다.");
              }},
            ]);
          }}
        />
      </View>

      {/* 구분선 */}
      <View style={{ height: 1, backgroundColor: colors.gray[200], marginVertical: spacing.md }} />

      {/* 댓글 리스트 */}
      <Text style={[typography.h4, { color: colors.text.primary }]}>댓글</Text>
      {comments.map((c) => (
        <View key={c.id} style={{ paddingVertical: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.body, { color: colors.text.primary, lineHeight: 20 }]}>{c.body}</Text>
            <Text style={[typography.small, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
              {formatKST(c.createdAt)}  {/* ✅ 댓글 시각 */}
            </Text>
          </View>
        </View>
      ))}

      {/* 댓글 입력/등록 */}
      <TextInput
        placeholder="댓글 남기기"
        value={comment}
        onChangeText={setComment}
        style={{
          borderWidth: 1,
          borderColor: colors.gray[300],
          padding: spacing.md,
          borderRadius: borderRadius.md,
          color: colors.text.primary,
          backgroundColor: colors.background.light,
        }}
      />
      <Button
        title={busy ? "등록 중..." : "등록"}
        size="sm"
        style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
        onPress={async () => {
          const text = comment.trim();
          if (!text) {
            Alert.alert("안내", "댓글이 비어 있습니다."); // ✅ 즉시 안내
            return;
          }
          setBusy(true);
          try {
            await ensureAnonSignIn();      // ✅ 로그인 보장
            await addComment(post.id, text);
            setComment("");
          } catch (e: any) {
            Alert.alert("오류", e?.message ?? "댓글 실패");
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
