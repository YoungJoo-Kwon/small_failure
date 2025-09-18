import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Post } from "../lib/posts";
import { formatKST } from "../lib/datetime";

export default function PostItem({ post }: { post: Post }) {
  const created = formatKST(post.createdAt); // ⬅️ 서울 기준 문자열

  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable style={{ padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "bold" }} numberOfLines={1}>{post.title}</Text>
          <Text style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>{created}</Text>
        </View>

        <Text numberOfLines={2} style={{ color: "#444", marginTop: 4 }}>{post.body}</Text>

        <Text style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
          공감 {post.likeCount ?? 0} · 댓글 {post.commentCount ?? 0}
        </Text>
      </Pressable>
    </Link>
  );
}
