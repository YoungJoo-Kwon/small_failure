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
  addAttachComment, 
  Comment, 
} from "../../src/lib/posts";

import Button from "../../src/components/common/Button";
import Card from "../../src/components/common/Card"; // ✅ 추가
import { colors, typography, spacing, borderRadius } from "../../src/styles/theme";

import AttachModal from "../../src/components/attach/AttachModal";

const router = useRouter();

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: colors.background.surface, padding: spacing.lg, gap: spacing.md}}>
      {/* ====== 본문 카드 ====== */}
      <Card
        style={{
          padding: spacing.lg,
          backgroundColor: colors.background.light, // ✅ “하얀 박스” 느낌 보장
        }}
      >  
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
          onPress={async () => {
            await ensureAnonSignIn();    // ✅ 먼저 보장
            setAttachOpen(true);
          }}
        />

        <AttachModal
          visible={attachOpen}
          excludeId={post.id}
          onClose={()=>setAttachOpen(false)}
          onSelect={async (childId) => {
            try {
              await ensureAnonSignIn();
              await addAttachComment(post.id, childId);
              setAttachOpen(false);
              Alert.alert("완료", "실패담을 이어붙였습니다.");
            } catch (e:any) {
              console.error("addAttachComment failed:", e); 
              Alert.alert("오류", e?.message ?? "붙이기 실패");
            }
          }}
        />
      </View>
    </Card>

      {/* ====== 댓글 카드 ====== */}
      <Card style={{ padding: spacing.lg, backgroundColor: colors.background.light }}>
        <Text style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>댓글</Text>

        {/*{comments.map((c) => (
          <View key={c.id} style={{ paddingVertical: spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.body, { color: colors.text.primary, lineHeight: 20 }]}>{c.body}</Text>
              <Text style={[typography.small, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
                {formatKST(c.createdAt)}
              </Text>
            </View>
          </View>
        ))}*/}
        {comments.map((c) => {
          // ⬇️ attach 타입: 이어붙인 실패담 미리보기 카드
          if (c.type === "attach" && c.attachedPostId) {
            return (
              <View key={c.id} style={{ paddingVertical: spacing.sm }}>
                <Card style={{ padding: spacing.md, backgroundColor: colors.background.light }}>
                  <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                    🔗 이어진 실패담
                  </Text>

                  {/* 제목 */}
                  <Text style={[typography.body, { color: colors.text.primary }]}>
                    {c.attachedTitle}
                  </Text>

                  {/* 본문 스니펫 */}
                  {!!c.attachedSnippet && (
                    <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                      {c.attachedSnippet}
                    </Text>
                  )}

                  {/* 핵심 교훈 박스 */}
                  {!!c.attachedLessons && (
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        padding: spacing.sm,
                        borderRadius: borderRadius.md,
                        marginTop: spacing.xs,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.accent,
                      }}
                    >
                      <Text style={[typography.caption, { color: colors.text.accent, fontWeight: "600" }]}>
                        핵심 교훈
                      </Text>
                      <Text style={[typography.caption, { color: colors.text.accent, marginTop: 2 }]}>
                        {c.attachedLessons}
                      </Text>
                    </View>
                  )}

                  {/* 이동 버튼 */}
                  <View style={{ flexDirection: "row", columnGap: spacing.sm, marginTop: spacing.sm }}>
                    <Button
                      title="자세히"
                      size="sm"
                      variant="secondary"
                      onPress={() => router.push(`/post/${c.attachedPostId}` as any)}
                    />
                  </View>
                </Card>
              </View>
            );
          }

          // ⬇️ 기본: 텍스트 댓글
          return (
            <View key={c.id} style={{ paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.body, { color: colors.text.primary, lineHeight: 20 }]}>
                  {c.body}
                </Text>
                <Text style={[typography.small, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
                  {formatKST(c.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}

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
            marginTop: spacing.sm,
          }}
        />
        <Button
          title={busy ? "등록 중..." : "등록"}
          size="sm"
          style={{ backgroundColor: colors.accent, borderColor: colors.accent, marginTop: spacing.xs }}
          onPress={async () => {
            const text = comment.trim();
            if (!text) {
              Alert.alert("안내", "댓글이 비어 있습니다.");
              return;
            }
            setBusy(true);
            try {
              await ensureAnonSignIn();
              await addComment(post.id, text);
              setComment("");
            } catch (e: any) {
              Alert.alert("오류", e?.message ?? "댓글 실패");
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>

      {/* ====== (예고) 붙이기로 이어지는 작은 실패들 영역 ====== */}
      <Card style={{ padding: spacing.lg, backgroundColor: colors.background.light }}>
        <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
          🔗 곧 여기에 “붙이기”로 이어지는 작은 실패들이 표시됩니다.
        </Text>
      </Card>
    </View>
  );
}
