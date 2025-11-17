# 대안 C 고급 기능 상세 설명 및 구현 방안

**작성일**: 2025-01-XX  
**대상**: 홈(피드) 화면 고급 기능

---

## 1. 필터 기능

### 📖 개념 설명

**필터 기능이란?**
- 피드에서 특정 조건에 맞는 글만 보여주는 기능
- 현재는 정렬(최신순/공감순)만 있고, 필터는 없음
- 사용자가 관심 있는 주제나 유형의 글만 볼 수 있음

**필터의 가치**:
- 사용자 맞춤형 경험 제공
- 정보 과부하 감소
- 특정 주제에 집중 가능

---

### 🔧 구현 방안

#### 방안 1: 태그 필터 (권장 ⭐)

**개념**:
- 상단에 인기 태그를 필터 버튼으로 표시
- 태그 클릭 시 해당 태그가 포함된 글만 표시
- "전체" 옵션으로 필터 해제

**UI 디자인**:
```
[전체] [시험] [프로젝트] [인간관계] [시간관리] [커뮤니케이션] [업무]
  ↑      ↑       ↑         ↑          ↑           ↑            ↑
활성   선택가능  선택가능  선택가능   선택가능    선택가능     선택가능
```

**구현 단계**:

##### 1단계: 필터 상태 관리
```typescript
// app/index.tsx
const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
const popularTags = ["시험", "프로젝트", "인간관계", "시간관리", "커뮤니케이션", "업무"];

// 필터 적용된 데이터
const filteredPosts = useMemo(() => {
  if (!selectedFilter) return sortedPosts;
  return sortedPosts.filter(post => 
    post.tags?.includes(selectedFilter)
  );
}, [sortedPosts, selectedFilter]);
```

##### 2단계: 필터 UI 추가
```typescript
// 헤더에 필터 버튼 추가
const FilterBar = () => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={{ marginBottom: spacing.sm }}
  >
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
      <TouchableOpacity
        onPress={() => setSelectedFilter(null)}
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          backgroundColor: selectedFilter === null ? colors.accent : colors.background.light,
          borderWidth: 1,
          borderColor: selectedFilter === null ? colors.accent : colors.gray[200],
        }}
      >
        <Text style={[typography.caption, { 
          color: selectedFilter === null ? colors.text.inverse : colors.text.secondary 
        }]}>
          전체
        </Text>
      </TouchableOpacity>
      {popularTags.map((tag) => (
        <TouchableOpacity
          key={tag}
          onPress={() => setSelectedFilter(tag)}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: selectedFilter === tag ? colors.accent : colors.background.light,
            borderWidth: 1,
            borderColor: selectedFilter === tag ? colors.accent : colors.gray[200],
          }}
        >
          <Text style={[typography.caption, { 
            color: selectedFilter === tag ? colors.text.inverse : colors.text.secondary 
          }]}>
            #{tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
);
```

##### 3단계: 필터와 페이지네이션 통합
```typescript
// 필터가 적용되면 페이지네이션 리셋
useEffect(() => {
  if (selectedFilter) {
    // 필터 적용 시 모든 데이터 필요 (또는 필터된 데이터만 페이지네이션)
    // 간단한 방법: 클라이언트 필터링 (현재 posts에서 필터)
    setHasMore(false); // 필터 적용 시 페이지네이션 비활성화
  } else {
    setHasMore(true); // 필터 해제 시 페이지네이션 활성화
  }
}, [selectedFilter]);
```

**장점**:
- ✅ 구현 간단 (클라이언트 필터링)
- ✅ 사용자 니즈 높음
- ✅ 탐색 기능과 연계 가능

**단점**:
- ⚠️ 필터 적용 시 페이지네이션 제한적 (모든 데이터 필요)
- ⚠️ 서버 사이드 필터링이 더 효율적이지만 복잡

**예상 시간**: 3-4시간

---

#### 방안 2: 글머리 필터

**개념**:
- 공감구함/조언구함/혼쭐내줘 필터
- 여러 개 선택 가능 (체크박스)

**구현**:
```typescript
const [selectedRequestTypes, setSelectedRequestTypes] = useState<Set<"공감구함" | "조언구함" | "혼쭐내줘">>(new Set());

const filteredPosts = useMemo(() => {
  if (selectedRequestTypes.size === 0) return sortedPosts;
  return sortedPosts.filter(post => 
    selectedRequestTypes.has(post.requestType ?? "공감구함")
  );
}, [sortedPosts, selectedRequestTypes]);
```

**장점**:
- ✅ 글의 의도에 따라 필터링
- ✅ 여러 개 선택 가능

**단점**:
- ⚠️ 사용 빈도가 낮을 수 있음
- ⚠️ UI 복잡도 증가

**예상 시간**: 2-3시간

---

#### 방안 3: 날짜 필터

**개념**:
- 오늘/이번 주/이번 달/전체
- 날짜 범위 선택

**구현**:
```typescript
type DateFilter = "today" | "week" | "month" | "all";
const [dateFilter, setDateFilter] = useState<DateFilter>("all");

const filteredPosts = useMemo(() => {
  if (dateFilter === "all") return sortedPosts;
  
  const now = Date.now();
  const filterTime = {
    today: now - 24 * 60 * 60 * 1000,
    week: now - 7 * 24 * 60 * 60 * 1000,
    month: now - 30 * 24 * 60 * 60 * 1000,
  }[dateFilter];
  
  return sortedPosts.filter(post => {
    const postTime = post.createdAt?.toMillis?.() ?? 0;
    return postTime >= filterTime;
  });
}, [sortedPosts, dateFilter]);
```

**장점**:
- ✅ 최신 글에 집중 가능
- ✅ 시간대별 트렌드 파악

**단점**:
- ⚠️ 사용 빈도 낮을 수 있음
- ⚠️ 날짜 계산 복잡

**예상 시간**: 2-3시간

---

#### 방안 4: 복합 필터 (태그 + 글머리 + 날짜)

**개념**:
- 여러 필터를 동시에 적용
- 필터 조합 가능

**구현 복잡도**: 높음  
**예상 시간**: 6-8시간

**권장**: 방안 1 (태그 필터)만 먼저 구현
- 가장 유용하고 구현 간단
- 필요 시 다른 필터 추가 가능

---

### 📊 필터 기능 비교

| 필터 유형 | 사용 빈도 | 구현 난이도 | 예상 시간 | 권장도 |
|----------|----------|------------|----------|--------|
| 태그 필터 | 높음 | 낮음 | 3-4시간 | ⭐⭐⭐ |
| 글머리 필터 | 중간 | 낮음 | 2-3시간 | ⭐⭐ |
| 날짜 필터 | 낮음 | 중간 | 2-3시간 | ⭐ |
| 복합 필터 | 높음 | 높음 | 6-8시간 | ⭐⭐ |

---

## 2. 북마크/즐겨찾기 기능

### 📖 개념 설명

**북마크 기능이란?**
- 사용자가 나중에 다시 보고 싶은 글을 저장하는 기능
- 마이페이지에서 북마크한 글만 모아서 볼 수 있음
- SNS의 "저장" 기능과 유사

**북마크의 가치**:
- ✅ 중요한 글 나중에 다시 보기
- ✅ 개인화된 컬렉션 관리
- ✅ 사용자 참여도 증가

---

### 🔧 구현 방안

#### 방안 1: 간단한 북마크 (권장 ⭐)

**개념**:
- 각 PostItem에 북마크 아이콘 추가
- Firestore에 `bookmarks` 컬렉션 생성
- 마이페이지에 북마크 탭 추가

**데이터 구조**:
```
bookmarks/{bookmarkId}
  - userId: string
  - postId: string
  - createdAt: timestamp
```

**구현 단계**:

##### 1단계: 북마크 함수 구현
```typescript
// src/lib/bookmarks.ts (새 파일)

import { auth, db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import type { Post } from "./posts";

// 북마크 추가
export async function addBookmark(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  // 중복 체크
  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("이미 북마크한 글입니다.");
  }

  await addDoc(collection(db, "bookmarks"), {
    userId: uid,
    postId,
    createdAt: serverTimestamp(),
  });
}

// 북마크 제거
export async function removeBookmark(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

// 북마크 토글
export async function toggleBookmark(postId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    await removeBookmark(postId);
    return false; // 북마크 해제
  } else {
    await addBookmark(postId);
    return true; // 북마크 추가
  }
}

// 내 북마크 목록 구독
export function listenMyBookmarks(cb: (postIds: string[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb([]);
    return () => {};
  }

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const postIds = snap.docs.map(d => d.data().postId);
    cb(postIds);
  });
}

// 특정 글의 북마크 여부 확인
export function listenBookmarkStatus(postId: string, cb: (bookmarked: boolean) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb(false);
    return () => {};
  }

  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", uid),
    where("postId", "==", postId)
  );

  return onSnapshot(q, (snap) => {
    cb(!snap.empty);
  });
}
```

##### 2단계: PostItem에 북마크 버튼 추가
```typescript
// src/components/PostItem.tsx 수정

import { toggleBookmark, listenBookmarkStatus } from "../lib/bookmarks";
import { Ionicons } from "@expo/vector-icons";

// PostItem 컴포넌트 내부
const [bookmarked, setBookmarked] = useState(false);

useEffect(() => {
  if (!post.id) return;
  const unsub = listenBookmarkStatus(post.id, setBookmarked);
  return () => unsub();
}, [post.id]);

const handleBookmark = async () => {
  try {
    await toggleBookmark(post.id);
    // 상태는 listenBookmarkStatus에서 자동 업데이트됨
  } catch (e) {
    Alert.alert("오류", "북마크 처리에 실패했습니다.");
  }
};

// UI에 북마크 버튼 추가 (통계 옆)
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
  <View style={{ flexDirection: 'row', gap: spacing.md }}>
    <Text>❤️ {post.likeCount ?? 0}</Text>
    <Text>💬 {post.commentCount ?? 0}</Text>
  </View>
  <TouchableOpacity onPress={handleBookmark}>
    <Ionicons 
      name={bookmarked ? "bookmark" : "bookmark-outline"} 
      size={20} 
      color={bookmarked ? colors.accent : colors.text.secondary} 
    />
  </TouchableOpacity>
</View>
```

##### 3단계: 마이페이지에 북마크 탭 추가
```typescript
// app/me/bookmarks.tsx (새 파일)

import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { listenMyBookmarks } from "../../src/lib/bookmarks";
import { getPost } from "../../src/lib/posts";
import PostItem from "../../src/components/PostItem";
import type { Post } from "../../src/lib/posts";

export default function MyBookmarksScreen() {
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const unsub = listenMyBookmarks((postIds) => {
      setBookmarkedPostIds(postIds);
      // 각 postId로 Post 데이터 가져오기
      const postPromises = postIds.map(id => 
        new Promise<Post | null>((resolve) => {
          const unsubPost = getPost(id, (post) => {
            unsubPost();
            resolve(post);
          });
        })
      );
      Promise.all(postPromises).then((results) => {
        setPosts(results.filter((p): p is Post => p !== null));
      });
    });
    return () => unsub();
  }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostItem post={item} mode="light" />}
    />
  );
}
```

##### 4단계: Firestore Rules 추가
```javascript
// firestore.rules 수정

match /bookmarks/{bookmarkId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow update: if false; // 업데이트 불가
}
```

**장점**:
- ✅ 사용자 가치 높음
- ✅ 구현 구조 명확
- ✅ 확장 가능 (북마크 폴더, 태그 등)

**단점**:
- ⚠️ Firestore 읽기 비용 증가
- ⚠️ 북마크한 글 삭제 시 처리 필요

**예상 시간**: 6-8시간

---

#### 방안 2: 읽음 표시 (간단한 대안)

**개념**:
- 읽은 글은 흐리게 표시
- 로컬 스토리지에 읽음 목록 저장
- 북마크보다 간단하지만 기능 제한적

**구현**:
```typescript
// AsyncStorage 사용
import AsyncStorage from '@react-native-async-storage/async-storage';

const readPostIdsKey = 'readPostIds';

export async function markAsRead(postId: string) {
  const readIds = await getReadPostIds();
  if (!readIds.includes(postId)) {
    await AsyncStorage.setItem(readPostIdsKey, JSON.stringify([...readIds, postId]));
  }
}

export async function getReadPostIds(): Promise<string[]> {
  const data = await AsyncStorage.getItem(readPostIdsKey);
  return data ? JSON.parse(data) : [];
}
```

**장점**:
- ✅ 구현 간단
- ✅ 서버 비용 없음

**단점**:
- ⚠️ 기능 제한적 (읽음 표시만)
- ⚠️ 기기 간 동기화 불가

**예상 시간**: 2-3시간

**권장**: 방안 1 (간단한 북마크)
- 사용자 가치 높음
- 확장 가능

---

## 3. 공감 버튼 직접 표시

### 📖 개념 설명

**공감 버튼 직접 표시란?**
- 피드에서 각 PostItem에 공감 버튼을 표시
- 상세 페이지로 이동하지 않고 바로 공감 가능
- 공감 상태(내가 공감했는지)도 표시

**현재 상태**:
- 공감 기능은 있으나 상세 페이지에서만 가능
- 피드에서는 공감 수만 표시
- `listenMyLike` 함수는 있으나 피드에서 사용 안 됨

**공감 버튼의 가치**:
- ✅ 사용자 참여도 증가
- ✅ 상호작용 편의성 향상
- ✅ SNS 스타일의 자연스러운 UX

---

### 🔧 구현 방안

#### 방안 1: 간단한 공감 버튼 (권장 ⭐)

**개념**:
- PostItem에 하트 아이콘 버튼 추가
- 클릭 시 즉시 공감/취소
- 공감 상태 시각적 표시

**구현 단계**:

##### 1단계: PostItem에 공감 버튼 추가
```typescript
// src/components/PostItem.tsx 수정

import { toggleLikeRobust } from "../lib/posts";
import { listenMyLike } from "../lib/likes";
import { Ionicons } from "@expo/vector-icons";

// PostItem 컴포넌트 내부
const [liked, setLiked] = useState(false);
const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);

useEffect(() => {
  if (!post.id) return;
  const unsub = listenMyLike(post.id, setLiked);
  return () => unsub();
}, [post.id]);

const handleLike = async () => {
  try {
    await toggleLikeRobust(post.id);
    // 상태는 실시간 구독으로 자동 업데이트됨
    // 하지만 즉시 피드백을 위해 낙관적 업데이트
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  } catch (e) {
    console.error("Like failed:", e);
    // 에러 시 원래 상태로 복구
    setLiked(!liked);
    setLikeCount(prev => liked ? prev + 1 : prev - 1);
  }
};

// UI 수정 (통계 부분)
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
  <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
    <TouchableOpacity 
      onPress={handleLike}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
    >
      <Ionicons 
        name={liked ? "heart" : "heart-outline"} 
        size={18} 
        color={liked ? colors.error || "#f87171" : colors.text.secondary} 
      />
      <Text style={[typography.caption, { 
        color: liked ? colors.error || "#f87171" : colors.text.secondary 
      }]}>
        {likeCount}
      </Text>
    </TouchableOpacity>
    <Text style={[typography.caption, { color: colors.text.secondary }]}>
      💬 {post.commentCount ?? 0}
    </Text>
  </View>
  <Text style={[typography.small, { color: colors.text.disabled }]}>
    자세히 보기 →
  </Text>
</View>
```

**장점**:
- ✅ 구현 간단
- ✅ 즉시 피드백
- ✅ 사용자 참여도 증가

**단점**:
- ⚠️ 각 PostItem마다 구독 생성 (성능 고려 필요)
- ⚠️ UI 공간 사용

**예상 시간**: 3-4시간

---

#### 방안 2: 공감 버튼 + 애니메이션

**개념**:
- 공감 버튼 클릭 시 하트 애니메이션
- 더 풍부한 시각적 피드백

**구현**:
```typescript
import { Animated } from "react-native";

const scaleAnim = useRef(new Animated.Value(1)).current;

const handleLike = async () => {
  // 애니메이션
  Animated.sequence([
    Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
  ]).start();

  await toggleLikeRobust(post.id);
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <Ionicons name={liked ? "heart" : "heart-outline"} />
</Animated.View>
```

**장점**:
- ✅ 시각적 피드백 우수
- ✅ 사용자 경험 향상

**단점**:
- ⚠️ 구현 복잡도 증가
- ⚠️ 성능 영향 (작음)

**예상 시간**: 4-5시간

---

#### 방안 3: 공감한 사용자 아바타 표시

**개념**:
- 최근 공감한 3명의 아바타 표시
- "외 N명" 표시
- 클릭 시 전체 목록 보기

**구현**:
```typescript
// 공감한 사용자 목록 가져오기
export function listenPostLikes(postId: string, cb: (userIds: string[]) => void) {
  const q = query(
    collection(db, "posts", postId, "likes"),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  return onSnapshot(q, (snap) => {
    const userIds = snap.docs.map(d => d.data().userId);
    cb(userIds);
  });
}

// PostItem에서 사용
const [likedUserIds, setLikedUserIds] = useState<string[]>([]);

useEffect(() => {
  const unsub = listenPostLikes(post.id, (userIds) => {
    setLikedUserIds(userIds.slice(0, 3)); // 최근 3명만
  });
  return () => unsub();
}, [post.id]);

// UI에 아바타 표시
<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
  {likedUserIds.map((userId, idx) => (
    <Avatar key={userId} authorId={userId} size={20} style={{ marginLeft: idx > 0 ? -8 : 0 }} />
  ))}
  {likeCount > likedUserIds.length && (
    <Text style={[typography.caption, { color: colors.text.secondary }]}>
      외 {likeCount - likedUserIds.length}명
    </Text>
  )}
</View>
```

**장점**:
- ✅ 소셜 요소 강화
- ✅ 공감한 사람 확인 가능

**단점**:
- ⚠️ 구현 복잡
- ⚠️ 성능 영향 (각 PostItem마다 구독)
- ⚠️ 익명성과 충돌 가능

**예상 시간**: 6-8시간

**권장**: 방안 1 (간단한 공감 버튼)
- 구현 간단
- 효과적
- 필요 시 애니메이션 추가 가능

---

### 📊 공감 버튼 기능 비교

| 기능 | 구현 난이도 | 예상 시간 | 사용자 가치 | 권장도 |
|------|------------|----------|------------|--------|
| 간단한 공감 버튼 | 낮음 | 3-4시간 | 높음 | ⭐⭐⭐ |
| 공감 버튼 + 애니메이션 | 중간 | 4-5시간 | 높음 | ⭐⭐ |
| 공감한 사용자 아바타 | 높음 | 6-8시간 | 중간 | ⭐ |

---

## 📊 전체 기능 비교 및 권장사항

### 기능별 상세 비교

| 기능 | 사용 빈도 | 구현 난이도 | 예상 시간 | 사용자 가치 | 권장도 |
|------|----------|------------|----------|------------|--------|
| **태그 필터** | 높음 | 낮음 | 3-4시간 | 높음 | ⭐⭐⭐ |
| **북마크** | 높음 | 중간 | 6-8시간 | 높음 | ⭐⭐⭐ |
| **공감 버튼** | 매우 높음 | 낮음 | 3-4시간 | 매우 높음 | ⭐⭐⭐ |

---

## 🎯 구현 우선순위 권장

### Phase 1: 공감 버튼 (최우선)
**이유**:
- 사용자 참여도에 가장 큰 영향
- 구현 간단
- 즉시 효과

**예상 시간**: 3-4시간  
**완성도 향상**: 90% → 92%

---

### Phase 2: 태그 필터
**이유**:
- 사용자 맞춤형 경험
- 탐색 기능과 연계
- 구현 난이도 낮음

**예상 시간**: 3-4시간  
**완성도 향상**: 92% → 94%

---

### Phase 3: 북마크
**이유**:
- 사용자 가치 높음
- 하지만 구현 복잡도 높음
- 다른 기능보다 우선순위 낮음

**예상 시간**: 6-8시간  
**완성도 향상**: 94% → 96%

---

## 💡 최종 권장사항

### 즉시 구현 권장 (Phase 1)
**공감 버튼 직접 표시**
- 가장 높은 사용자 가치
- 구현 간단
- 즉시 효과

### 단기 구현 (Phase 2)
**태그 필터**
- 사용자 경험 개선
- 탐색 기능과 연계

### 장기 구현 (Phase 3)
**북마크 기능**
- 사용자 가치 높지만 복잡
- 다른 기능 완성 후 진행

---

## ⚠️ 주의사항

### 공감 버튼
1. **성능 고려**
   - 각 PostItem마다 `listenMyLike` 구독 생성
   - 피드에 20개가 있으면 20개 구독
   - 해결: 구독 최적화 또는 배치 처리

2. **낙관적 업데이트**
   - 클릭 즉시 UI 업데이트
   - 실패 시 롤백

### 태그 필터
1. **페이지네이션과 충돌**
   - 필터 적용 시 모든 데이터 필요
   - 해결: 필터 적용 시 페이지네이션 비활성화 또는 서버 사이드 필터링

2. **인기 태그 동적 로드**
   - 현재는 하드코딩
   - 향후 Firestore에서 동적으로 가져오기 가능

### 북마크
1. **Firestore 비용**
   - 북마크마다 문서 생성
   - 읽기 비용 증가
   - 해결: 인덱스 최적화, 캐싱

2. **삭제된 글 처리**
   - 북마크한 글이 삭제되면?
   - 해결: 북마크 목록에서 자동 제거 또는 "삭제된 글" 표시

---

## 📝 결론

### 즉시 구현 권장
1. **공감 버튼 직접 표시** (3-4시간)
   - 가장 높은 가치
   - 구현 간단

### 단기 구현
2. **태그 필터** (3-4시간)
   - 사용자 경험 개선

### 장기 구현
3. **북마크 기능** (6-8시간)
   - 복잡하지만 가치 높음

**총 예상 시간**: 12-16시간 (1.5-2주)

**완성도 향상**: 90% → 96%

---

**작성일**: 2025-01-XX  
**다음 단계**: 구현 결정 후 진행

