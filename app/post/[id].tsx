// app/post/[id].tsx
import { useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
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
    return <View style={{ padding: 16 }}><Text>불러오는 중...</Text></View>;
  }

  // ⬅️ ① 작성 일시 문자열 (서울/KST)
  const createdLabel = formatKST(post.createdAt);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {/* 제목 */}
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{post.title}</Text>

      {/* ⬅️ ① 작성 일시 표시 (제목 아래) */}
      <Text style={{ fontSize: 12, color: "#666" }}>작성: {createdLabel}</Text>

      {/* ⬅️ ③ 본문 가독성 개선: 줄간, 여백, 색상 */}
      <Text style={{ lineHeight: 22, color: "#333", marginTop: 8 }}>
        {post.body}
      </Text>

      {/* 배운 점 강조 */}
      <Text style={{ marginTop: 8, fontStyle: "italic", color: "#444" }}>
        배운 점: {post.lessons}
      </Text>

      {/* ⬅️ ② 태그 배지 (있을 때만) */}
      {post.tags?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          {post.tags.map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: "#f2f2f2"
              }}
            >
              <Text style={{ fontSize: 12, color: "#555" }}>#{t}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 메타: 공감/댓글 수 */}
      <Text style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
        공감 {post.likeCount ?? 0} · 댓글 {post.commentCount ?? 0}
      </Text>

      {/* 공감 & 신고 버튼 */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Button title="공감" onPress={async () => {
          try {
            await ensureAnonSignIn();             // ✅
            await toggleLikeRobust(post.id);
          } catch (e:any) {
            console.error(e);
             Alert.alert("오류", e?.message ?? "공감 실패");
          }
        }}
      />
        <Button
          title="신고"
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

        {post.authorId && auth.currentUser?.uid === post.authorId && (
          <Button color="#c00" title="삭제" onPress={() => {
            Alert.alert("삭제", "정말 삭제할까요?", [
              { text: "취소", style: "cancel" },
              { text: "삭제", style: "destructive", onPress: async () => {
                try {
                  await ensureAnonSignIn();      // ✅
                  await deletePostAndComments(post.id);
                  Alert.alert("삭제되었습니다.");
                  router.back(); // 목록으로 돌아가기
                } catch (e: any) {
                  console.error(e);
                  Alert.alert("오류", e?.message ?? "삭제 실패");
                }
                },
              },
            ]);
          }}
        />
      )}
      </View>

      {/* 구분선 */}
      <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 8 }} />

      {/* 댓글 리스트 */}
      <Text style={{ fontWeight: "bold" }}>댓글</Text>
      {comments.map((c) => (
        <View key={c.id} style={{ paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ lineHeight: 20 }}>{c.body}</Text>
            <Text style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>
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
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />
      <Button
        title={busy ? "등록 중..." : "등록"}
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
