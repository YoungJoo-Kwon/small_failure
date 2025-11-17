// app/post/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TextInput, Alert, ScrollView, Image, Platform, Switch, TouchableOpacity } from "react-native";
import { auth } from "../../src/lib/firebase";
//import { deletePostAndComments, toggleLikeRobust } from "../../src/lib/posts";
import { ensureAnonSignIn } from "../../src/lib/auth";
import { formatKST } from "../../src/lib/datetime";              // ⬅️ ① 작성 일시 포맷 유틸
import { Keyboard } from "react-native";
import { listenMyLike } from "../../src/lib/likes";

import {
  getPost,           // 실시간 구독
  toggleLikeRobust,        // 공감
  addComment,        // 댓글 등록
  deleteComment,     // 댓글 삭제
  reportPost,        // 신고
  Post, 
  deletePostAndComments,
  addAttachComment,
  updatePost,
  Comment, 
} from "../../src/lib/posts";

import Button from "../../src/components/common/Button";
import Card from "../../src/components/common/Card"; // ✅ 추가
import { useTheme } from "../../src/contexts/ThemeContext";
import Avatar from "../../src/components/Avatar";

import AttachModal from "../../src/components/attach/AttachModal";
import AppHeader from "../../src/components/AppHeader";

export default function PostDetail() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [liked, setLiked] = useState(false); // ✅ 공감 상태
  const [editing, setEditing] = useState(false); // ✅ 수정 모드
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editLessons, setEditLessons] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editRequestType, setEditRequestType] = useState<"공감구함" | "조언구함" | "혼쭐내줘">("공감구함");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">("public");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = getPost(id as string, (p, c) => {
      setPost(p);
      setComments(c);
      // 수정 모드가 아닐 때만 초기값 설정
      if (!editing && p) {
        setEditTitle(p.title);
        setEditBody(p.body);
        setEditLessons(p.lessons);
        setEditTags(p.tags?.join(", ") || "");
        setEditRequestType(p.requestType ?? "공감구함");
        setEditVisibility(p.visibility ?? "public");
      }
    });
    return () => unsub && unsub();
  }, [id, editing]);

  // ✅ 공감 상태 실시간 구독
  useEffect(() => {
    if (!post?.id) return;
    const unsub = listenMyLike(post.id, setLiked);
    return () => unsub && unsub();
  }, [post?.id]);

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
        <AppHeader title="실패담 상세" subtitle="기록을 불러오는 중..." />
        <View style={{ flex: 1, padding: spacing.lg }}>
          <Text style={[typography.body]}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // ⬅️ ① 작성 일시 문자열 (서울/KST)
  const createdLabel = formatKST(post.createdAt);
  
  // 본인 글인지 확인
  const isMyPost = post.authorId === auth.currentUser?.uid;
  
  // 댓글 삭제 핸들러 (공통)
  const handleDeleteComment = async (commentId: string, postId: string) => {
    console.log("[댓글 삭제] 삭제 실행 시작", { commentId, postId });
    try {
      await ensureAnonSignIn();
      console.log("[deleteComment] 시작:", { commentId, postId });
      await deleteComment(commentId, postId);
      console.log("[deleteComment] 성공");
      // 댓글 목록은 실시간 구독으로 자동 업데이트됨
      if (Platform.OS === 'web') {
        // 웹에서는 간단한 알림
        console.log("댓글이 삭제되었습니다.");
      } else {
        Alert.alert("완료", "댓글이 삭제되었습니다.");
      }
    } catch (e: any) {
      console.error("[deleteComment] 실패:", e?.code, e?.message, e);
      if (Platform.OS === 'web') {
        alert(e?.message ?? "댓글 삭제 실패");
      } else {
        Alert.alert("오류", e?.message ?? "댓글 삭제 실패");
      }
    }
  };

  // 글 삭제 핸들러
  const handleDelete = async () => {
    let shouldDelete = false;
    
    if (Platform.OS === 'web') {
      shouldDelete = window.confirm("정말 이 글을 삭제하시겠어요? 삭제된 글은 복구할 수 없습니다.");
    } else {
      return new Promise<void>((resolve) => {
        Alert.alert(
          "글 삭제",
          "정말 이 글을 삭제하시겠어요? 삭제된 글은 복구할 수 없습니다.",
          [
            { text: "취소", style: "cancel", onPress: () => resolve() },
            {
              text: "삭제",
              style: "destructive",
              onPress: () => {
                shouldDelete = true;
                resolve();
              },
            },
          ]
        );
      }).then(async () => {
        if (shouldDelete) {
          await executeDeletePost();
        }
      });
    }
    
    if (shouldDelete) {
      await executeDeletePost();
    }
  };

  const executeDeletePost = async () => {
    setDeleting(true);
    try {
      await ensureAnonSignIn();
      await deletePostAndComments(post.id);
      if (Platform.OS === 'web') {
        if (window.confirm("글이 삭제되었습니다. 홈으로 이동하시겠어요?")) {
          router.replace("/");
        }
      } else {
        Alert.alert("완료", "글이 삭제되었습니다.", [
          { text: "확인", onPress: () => router.replace("/") }
        ]);
      }
    } catch (e: any) {
      console.error("deletePostAndComments failed:", e);
      if (Platform.OS === 'web') {
        alert(e?.message ?? "삭제 실패");
      } else {
        Alert.alert("오류", e?.message ?? "삭제 실패");
      }
      setDeleting(false);
    }
  };

  // 글 수정 핸들러
  const handleEdit = () => {
    if (!post) return;
    setEditing(true);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditLessons(post.lessons);
    setEditTags(post.tags?.join(", ") || "");
    setEditRequestType(post.requestType ?? "공감구함");
    setEditVisibility(post.visibility ?? "public");
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (post) {
      setEditTitle(post.title);
      setEditBody(post.body);
      setEditLessons(post.lessons);
      setEditTags(post.tags?.join(", ") || "");
      setEditRequestType(post.requestType ?? "공감구함");
      setEditVisibility(post.visibility ?? "public");
    }
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    if (!editTitle.trim() || !editBody.trim() || !editLessons.trim()) {
      Alert.alert("안내", "제목/본문/배운 점은 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      await ensureAnonSignIn();
      await updatePost(post.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        lessons: editLessons.trim(),
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        requestType: editRequestType,
        visibility: editVisibility,
      });
      setEditing(false);
      Alert.alert("완료", "글이 수정되었습니다.");
    } catch (e: any) {
      console.error("updatePost failed:", e);
      Alert.alert("오류", e?.message ?? "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="실패담 상세" subtitle={post.title} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {/* ====== 본문 카드 ====== */}
        <Card
          style={{
            padding: spacing.lg,
            backgroundColor: colors.background.light, // ✅ "하얀 박스" 느낌 보장
          }}
        >
      {editing ? (
        /* 수정 모드 */
        <View>
          <Text style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
            글 수정
          </Text>

          {/* 공개 범위 & 글머리 */}
          <View style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
              <Text style={[typography.bodySmall, { color: colors.text.primary }]}>
                비공개
              </Text>
              <Switch
                value={editVisibility === "private"}
                onValueChange={(value) => setEditVisibility(value ? "private" : "public")}
                trackColor={{ false: colors.gray[300], true: colors.accent }}
                thumbColor={editVisibility === "private" ? colors.primary : colors.gray[400]}
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              {(["공감구함", "조언구함", "혼쭐내줘"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setEditRequestType(type)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: editRequestType === type ? colors.accent : colors.background.light,
                    borderWidth: 1,
                    borderColor: editRequestType === type ? colors.accent : colors.gray[200],
                  }}
                >
                  <Text style={[typography.caption, { 
                    color: editRequestType === type ? colors.text.inverse : colors.text.secondary 
                  }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 제목 */}
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
            제목
          </Text>
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="제목을 입력하세요"
            style={{
              borderWidth: 1,
              borderColor: colors.gray[300],
              padding: spacing.md,
              borderRadius: borderRadius.md,
              color: colors.text.primary,
              backgroundColor: colors.background.surface,
              marginBottom: spacing.md,
            }}
          />

          {/* 본문 */}
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
            본문
          </Text>
          <TextInput
            value={editBody}
            onChangeText={setEditBody}
            placeholder="실패담을 자세히 적어주세요"
            multiline
            numberOfLines={6}
            style={{
              borderWidth: 1,
              borderColor: colors.gray[300],
              padding: spacing.md,
              borderRadius: borderRadius.md,
              color: colors.text.primary,
              backgroundColor: colors.background.surface,
              minHeight: 120,
              textAlignVertical: "top",
              marginBottom: spacing.md,
            }}
          />

          {/* 배운 점 */}
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
            배운 점
          </Text>
          <TextInput
            value={editLessons}
            onChangeText={setEditLessons}
            placeholder="이 실패에서 배운 점을 적어주세요"
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: colors.gray[300],
              padding: spacing.md,
              borderRadius: borderRadius.md,
              color: colors.text.primary,
              backgroundColor: colors.background.surface,
              minHeight: 80,
              textAlignVertical: "top",
              marginBottom: spacing.md,
            }}
          />

          {/* 태그 */}
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
            태그 (쉼표로 구분)
          </Text>
          <TextInput
            value={editTags}
            onChangeText={setEditTags}
            placeholder="예: 시험, 프로젝트, 시간관리"
            style={{
              borderWidth: 1,
              borderColor: colors.gray[300],
              padding: spacing.md,
              borderRadius: borderRadius.md,
              color: colors.text.primary,
              backgroundColor: colors.background.surface,
              marginBottom: spacing.md,
            }}
          />

          {/* 저장/취소 버튼 */}
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button
              title={saving ? "저장 중..." : "저장"}
              size="sm"
              disabled={saving}
              loading={saving}
              style={{ flex: 1, backgroundColor: colors.accent, borderColor: colors.accent }}
              onPress={handleSaveEdit}
            />
            <Button
              title="취소"
              size="sm"
              variant="secondary"
              disabled={saving}
              style={{ flex: 1 }}
              onPress={handleCancelEdit}
            />
          </View>
        </View>
      ) : (
        /* 읽기 모드 */
        <>
      {/* 제목 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }}>
        <Text style={[typography.bodySmall, { 
          color: colors.text.accent, 
          fontWeight: '600',
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.md,
        }]}>
          {post.requestType === '조언구함' ? '[조언구함]' : post.requestType === '혼쭐내줘' ? '[혼쭐내줘]' : '[공감구함]'}
        </Text>
        <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>{post.title}</Text>
      </View>

      {/* ✅ 작성자 정보 (아바타 + 닉네임 + 작성일시) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
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
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            {post.authorNickname ?? "익명의 실패러"}
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            작성: {createdLabel}
          </Text>
        </View>
      </View>

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
      <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' }}>
        <Button 
          title={liked ? "공감 취소 ❤️" : "공감 🤍"} 
          size="sm" 
          style={{ 
            backgroundColor: liked ? colors.secondary : colors.accent, 
            borderColor: liked ? colors.secondary : colors.accent 
          }} 
          onPress={async () => {
            try {
              await ensureAnonSignIn();
              await toggleLikeRobust(post.id);
              // 상태는 listenMyLike가 자동 업데이트함
            } catch (e:any) {
              console.error("toggleLikeRobust failed:", e);
              Alert.alert("오류", e?.message ?? "공감 실패");
            }
          }} 
        />
        {!isMyPost && (
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
        )}

        <Button
          title="붙이기"
          size="sm"
          style={{ backgroundColor: colors.secondary, borderColor: colors.secondary }}
          onPress={async () => {
            await ensureAnonSignIn();    // ✅ 먼저 보장
            setAttachOpen(true);
          }}
        />
        
        {/* 본인 글일 때만 수정/삭제 버튼 표시 */}
        {isMyPost && (
          <>
            <Button
              title="✏️ 수정"
              size="sm"
              variant="secondary"
              disabled={deleting || saving}
              style={{ 
                backgroundColor: colors.secondary, 
                borderColor: colors.secondary 
              }}
              onPress={handleEdit}
            />
            <Button
              title={deleting ? "삭제 중..." : "🗑️ 삭제"}
              size="sm"
              variant="secondary"
              disabled={deleting || saving}
              loading={deleting}
              style={{ 
                backgroundColor: colors.error, 
                borderColor: colors.error 
              }}
              onPress={handleDelete}
            />
          </>
        )}

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
        </>
      )}
        </Card>

        {/* ====== 댓글 카드 (수정 모드가 아닐 때만 표시) ====== */}
        {!editing && (
        <Card style={{ padding: spacing.lg, backgroundColor: colors.background.light }}>
        <Text style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>댓글</Text>

        {comments.map((c) => {
          // ⬇️ attach 타입: 이어붙인 실패담 미리보기 카드
          if (c.type === "attach" && c.attachedPostId) {
            const isMyAttachComment = c.authorId === auth.currentUser?.uid;
            return (
              <View key={c.id} style={{ paddingVertical: spacing.sm }}>
                <Card style={{ padding: spacing.md, backgroundColor: colors.background.light }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      🔗 이어진 실패담
                    </Text>
                    {isMyAttachComment && (
                      <Button
                        title="삭제"
                        size="sm"
                        variant="secondary"
                        style={{
                          backgroundColor: colors.error,
                          borderColor: colors.error,
                          paddingHorizontal: spacing.xs,
                          paddingVertical: 2,
                          minHeight: 24,
                        }}
                        onPress={async () => {
                          console.log("[붙이기 댓글 삭제 버튼] 클릭됨", { commentId: c.id, postId: post.id, isMyAttachComment });
                          
                          // 웹에서는 window.confirm 사용, 네이티브에서는 Alert.alert 사용
                          let shouldDelete = false;
                          
                          if (Platform.OS === 'web') {
                            shouldDelete = window.confirm("정말 이 댓글을 삭제하시겠어요?");
                            console.log("[붙이기 댓글 삭제] window.confirm 결과:", shouldDelete);
                          } else {
                            return new Promise<void>((resolve) => {
                              Alert.alert(
                                "댓글 삭제",
                                "정말 이 댓글을 삭제하시겠어요?",
                                [
                                  { 
                                    text: "취소", 
                                    style: "cancel",
                                    onPress: () => {
                                      console.log("[붙이기 댓글 삭제] 취소됨");
                                      resolve();
                                    }
                                  },
                                  {
                                    text: "삭제",
                                    style: "destructive",
                                    onPress: () => {
                                      shouldDelete = true;
                                      resolve();
                                    },
                                  },
                                ]
                              );
                            }).then(async () => {
                              if (shouldDelete) {
                                await handleDeleteComment(c.id, post.id);
                              }
                            });
                          }
                          
                          if (shouldDelete) {
                            await handleDeleteComment(c.id, post.id);
                          }
                        }}
                      />
                    )}
                  </View>

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
          const isMyComment = c.authorId === auth.currentUser?.uid;
          return (
            <View key={c.id} style={{ paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* 댓글 작성자 아바타 */}
                <Avatar 
                  authorId={c.authorId}
                  snapshotAvatarUrl={c.authorAvatarUrl}
                  size={32}
                  style={{
                    marginRight: spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.gray[300],
                  }}
                />
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  {/* ✅ 댓글 작성자 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                    <Text style={[typography.small, { color: colors.text.secondary }]}>
                      {c.authorNickname ?? "익명의 실패러"}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text style={[typography.small, { color: colors.text.secondary }]}>
                        {formatKST(c.createdAt)}
                      </Text>
                      {isMyComment && (
                        <Button
                          title="삭제"
                          size="sm"
                          variant="secondary"
                          style={{
                            backgroundColor: colors.error,
                            borderColor: colors.error,
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                            minHeight: 24,
                          }}
                          onPress={async () => {
                            console.log("[댓글 삭제 버튼] 클릭됨", { commentId: c.id, postId: post.id, isMyComment });
                            
                            // 웹에서는 window.confirm 사용, 네이티브에서는 Alert.alert 사용
                            let shouldDelete = false;
                            
                            if (Platform.OS === 'web') {
                              shouldDelete = window.confirm("정말 이 댓글을 삭제하시겠어요?");
                              console.log("[댓글 삭제] window.confirm 결과:", shouldDelete);
                            } else {
                              return new Promise<void>((resolve) => {
                                Alert.alert(
                                  "댓글 삭제",
                                  "정말 이 댓글을 삭제하시겠어요?",
                                  [
                                    { 
                                      text: "취소", 
                                      style: "cancel",
                                      onPress: () => {
                                        console.log("[댓글 삭제] 취소됨");
                                        resolve();
                                      }
                                    },
                                    {
                                      text: "삭제",
                                      style: "destructive",
                                      onPress: async () => {
                                        shouldDelete = true;
                                        resolve();
                                      },
                                    },
                                  ]
                                );
                              }).then(async () => {
                                if (shouldDelete) {
                                  await handleDeleteComment(c.id, post.id);
                                }
                              });
                            }
                            
                            if (shouldDelete) {
                              await handleDeleteComment(c.id, post.id);
                            }
                          }}
                        />
                      )}
                    </View>
                  </View>
                  <Text style={[typography.body, { color: colors.text.primary, lineHeight: 20 }]}>
                    {c.body}
                  </Text>
                </View>
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
              Keyboard.dismiss();                      // 키보드 닫기(웹/네이티브 모두 안전)
            } catch (e: any) {
              console.error("addComment failed:", e?.code, e?.message, e); // ✅ 원인 로깅
              Alert.alert("오류", e?.message ?? "댓글 실패");
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
        )}

      {/* ====== (예고) 붙이기로 이어지는 작은 실패들 영역 (수정 모드가 아닐 때만 표시) ====== */}
      {!editing && (
      <Card style={{ padding: spacing.lg, backgroundColor: colors.background.light }}>
        <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
          🔗 곧 여기에 "붙이기"로 이어지는 작은 실패들이 표시됩니다.
        </Text>
        </Card>
      )}
      </ScrollView>
    </View>
  );
}
