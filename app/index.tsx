import { useEffect, useState } from "react";
import { View, FlatList, RefreshControl, Button } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { listenFeed, Post } from "../src/lib/posts";
import PostItem from "../src/components/PostItem";

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = listenFeed(setPosts);
    return () => unsub();
  }, []);

  useFocusEffect(() => {
    setRefreshing(false);
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12 }}>
        <Link href="/new" asChild>
          <Button title="새 글 쓰기" />
        </Link>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />
        }
        contentContainerStyle={{ padding: 12, gap: 12 }}
      />
    </View>
  );
}
