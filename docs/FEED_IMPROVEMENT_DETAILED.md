# 대안 B 상세 구현 방안

**작성일**: 2025-01-XX  
**대상**: 홈(피드) 화면 성능 최적화

---

## 1. 페이지네이션 (Pagination)

### 📖 개념 설명

**페이지네이션이란?**
- 대량의 데이터를 작은 단위로 나누어 점진적으로 로드하는 기법
- 초기에는 일부만 로드하고, 사용자가 스크롤할 때 추가 데이터를 로드

**현재 문제점**:
- `listenFeed`가 `limit(50)`으로 한 번에 50개를 모두 로드
- 글이 많아지면 초기 로딩 시간 증가
- 메모리 사용량 증가
- Firestore 읽기 비용 증가

**페이지네이션의 장점**:
- ✅ 초기 로딩 시간 단축
- ✅ 메모리 사용량 감소
- ✅ Firestore 읽기 비용 절감
- ✅ 사용자 경험 개선 (빠른 첫 화면 표시)

---

### 🔧 구현 방안

#### 방안 1: 무한 스크롤 (권장 ⭐)

**개념**:
- 사용자가 스크롤 끝에 도달하면 자동으로 다음 페이지 로드
- "더 보기" 버튼 없이 자연스러운 스크롤 경험

**구현 단계**:

##### 1단계: Firestore 쿼리 수정

```typescript
// src/lib/posts.ts 수정

// 기존 listenFeed를 페이지네이션 버전으로 변경
export function listenFeedPaginated(
  cb: (posts: Post[]) => void,
  pageSize: number = 20
) {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  
  return onSnapshot(q, (snap) => {
    const arr: Post[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((p) => p.status !== "hidden")
      .filter((p) => (p.visibility ?? "public") === "public");
    cb(arr);
  });
}

// 다음 페이지 로드 함수 추가
export async function loadNextPage(
  lastPost: Post,
  pageSize: number = 20
): Promise<Post[]> {
  if (!lastPost.createdAt) return [];
  
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    startAfter(lastPost.createdAt),
    limit(pageSize)
  );
  
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((p) => p.status !== "hidden")
    .filter((p) => (p.visibility ?? "public") === "public");
}
```

**주의사항**:
- `startAfter`는 `orderBy`와 동일한 필드를 사용해야 함
- Firestore 인덱스 필요: `posts(createdAt DESC)`

##### 2단계: 피드 화면 수정

```typescript
// app/index.tsx 수정

export default function FeedScreen() {
  const { colors, typography, spacing } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastPost, setLastPost] = useState<Post | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  // 초기 로드
  useEffect(() => {
    const unsub = listenFeedPaginated((newPosts) => {
      setPosts(newPosts);
      if (newPosts.length > 0) {
        setLastPost(newPosts[newPosts.length - 1]);
      }
      // 20개 미만이면 더 이상 데이터 없음
      setHasMore(newPosts.length >= 20);
    });
    return () => unsub();
  }, []);

  // 다음 페이지 로드
  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastPost) return;
    
    setLoadingMore(true);
    try {
      const nextPosts = await loadNextPage(lastPost);
      if (nextPosts.length > 0) {
        setPosts((prev) => [...prev, ...nextPosts]);
        setLastPost(nextPosts[nextPosts.length - 1]);
        setHasMore(nextPosts.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("loadMore failed:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // 스크롤 끝 감지
  const handleEndReached = () => {
    if (sortMode === "latest") {
      // 최신순일 때만 페이지네이션 (공감순은 클라이언트 정렬)
      loadMore();
    }
  };

  return (
    <FlatList
      data={sortedPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostItem post={item} mode="light" />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5} // 스크롤 끝에서 50% 전에 로드
      ListFooterComponent={
        loadingMore ? (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.sm }]}>
              더 불러오는 중...
            </Text>
          </View>
        ) : !hasMore && posts.length > 0 ? (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              모든 글을 불러왔어요
            </Text>
          </View>
        ) : null
      }
      // ... 기타 props
    />
  );
}
```

**주요 변경사항**:
- `listenFeedPaginated`: 초기 20개만 로드
- `loadNextPage`: 다음 페이지 로드 함수
- `onEndReached`: 스크롤 끝 감지
- `ListFooterComponent`: 로딩 상태 표시

##### 3단계: 공감순 정렬 처리

**문제**: 공감순은 클라이언트에서 정렬하므로 페이지네이션 어려움

**해결 방안**:

**대안 A: Firestore 인덱스 활용 (권장)**
```typescript
// Firestore에 복합 인덱스 생성 필요
// posts(likeCount DESC, createdAt DESC)

export function listenFeedByLikesPaginated(
  cb: (posts: Post[]) => void,
  pageSize: number = 20
) {
  const q = query(
    collection(db, "posts"),
    orderBy("likeCount", "desc"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  // ... 동일한 로직
}
```

**대안 B: 클라이언트 정렬 유지 (간단)**
```typescript
// 공감순일 때는 페이지네이션 비활성화
// 초기 20개만 로드하고 클라이언트에서 정렬
// "더 보기" 버튼으로 추가 로드
```

**권장**: 대안 A (Firestore 인덱스 활용)
- 서버 사이드 정렬로 성능 우수
- 일관된 페이지네이션 경험

---

#### 방안 2: "더 보기" 버튼

**개념**:
- 스크롤 끝에 "더 보기" 버튼 표시
- 사용자가 클릭하면 다음 페이지 로드

**장점**:
- 사용자가 명시적으로 로드 시점 제어
- 데이터 사용량 제어 가능

**단점**:
- 추가 클릭 필요
- 무한 스크롤보다 덜 자연스러움

**구현**:
```typescript
<ListFooterComponent={
  hasMore ? (
    <Button
      title={loadingMore ? "로딩 중..." : "더 보기"}
      onPress={loadMore}
      disabled={loadingMore}
      style={{ margin: spacing.lg }}
    />
  ) : (
    <Text style={[typography.caption, { textAlign: 'center', padding: spacing.lg, color: colors.text.secondary }]}>
      모든 글을 불러왔어요
    </Text>
  )
}
```

---

### ⚠️ 주의사항 및 고려사항

1. **Firestore 인덱스**
   - `startAfter` 사용 시 인덱스 필수
   - `firestore.indexes.json`에 추가 필요

2. **실시간 업데이트 처리**
   - 새 글이 추가되면 첫 페이지에 추가
   - 기존 페이지네이션과 충돌 가능
   - 해결: 새 글은 별도로 관리하거나 페이지 리셋

3. **정렬 모드 변경 시**
   - 정렬 모드 변경 시 페이지네이션 리셋 필요
   - `setPosts([])`, `setLastPost(null)`, `setHasMore(true)`

4. **성능 최적화**
   - `onEndReachedThreshold`: 0.3~0.5 권장
   - 너무 작으면 자주 호출, 너무 크면 늦게 로드

---

## 2. 이미지 Lazy Loading

### 📖 개념 설명

**Lazy Loading이란?**
- 이미지를 화면에 보일 때만 로드하는 기법
- 초기에는 placeholder만 표시하고, 스크롤하여 보일 때 실제 이미지 로드

**현재 문제점**:
- PostItem에서 이미지가 있으면 즉시 로드
- 피드에 많은 이미지가 있으면 초기 로딩 느림
- 데이터 사용량 증가

**Lazy Loading의 장점**:
- ✅ 초기 로딩 시간 단축
- ✅ 데이터 사용량 절감
- ✅ 메모리 사용량 감소
- ✅ 사용자 경험 개선

---

### 🔧 구현 방안

#### 방안 1: Intersection Observer 패턴 (권장 ⭐)

**개념**:
- React Native의 `onViewableItemsChanged` 활용
- 화면에 보이는 아이템만 이미지 로드

**구현 단계**:

##### 1단계: LazyImage 컴포넌트 생성

```typescript
// src/components/common/LazyImage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LazyImageProps {
  uri: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export default function LazyImage({
  uri,
  style,
  containerStyle,
  placeholder,
  resizeMode = 'cover',
}: LazyImageProps) {
  const { colors } = useTheme();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // shouldLoad가 true일 때만 이미지 로드
  useEffect(() => {
    if (shouldLoad && uri) {
      setLoading(true);
      setError(false);
    }
  }, [shouldLoad, uri]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // 외부에서 로드 트리거 (FlatList의 onViewableItemsChanged에서 호출)
  const triggerLoad = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  // React.forwardRef로 ref 전달 가능하도록 (선택사항)
  // 또는 useImperativeHandle 사용

  return (
    <View style={containerStyle}>
      {!shouldLoad ? (
        // Placeholder (로드 전)
        placeholder || (
          <View style={[styles.placeholder, { backgroundColor: colors.gray[200] }]}>
            <ActivityIndicator color={colors.gray[400]} size="small" />
          </View>
        )
      ) : (
        // 실제 이미지
        <>
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
          {error ? (
            <View style={[styles.placeholder, { backgroundColor: colors.gray[200] }]}>
              <Text style={{ color: colors.text.secondary }}>이미지 로드 실패</Text>
            </View>
          ) : (
            <Image
              source={{ uri }}
              style={style}
              resizeMode={resizeMode}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 200,
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
```

##### 2단계: PostItem에 LazyImage 적용

```typescript
// src/components/PostItem.tsx 수정

import LazyImage from './common/LazyImage';

// detailed 모드의 이미지 부분 수정
{post.imageUrl && (
  <LazyImage
    uri={post.imageUrl}
    style={{
      width: '100%',
      height: 200,
      borderRadius: borderRadius.md,
    }}
    resizeMode="cover"
    placeholder={
      <View style={{
        width: '100%',
        height: 200,
        backgroundColor: colors.gray[200],
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator color={colors.gray[400]} />
      </View>
    }
  />
)}
```

##### 3단계: FlatList의 onViewableItemsChanged 활용

```typescript
// app/index.tsx 수정

const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());

const onViewableItemsChanged = useRef(({ viewableItems: items }: any) => {
  const visibleIds = new Set(items.map((item: any) => item.key));
  setViewableItems(visibleIds);
}).current;

const viewabilityConfig = useRef({
  itemVisiblePercentThreshold: 50, // 50% 이상 보이면 visible
  minimumViewTime: 100, // 최소 100ms 보여야 visible
}).current;

return (
  <FlatList
    data={sortedPosts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <PostItem 
        post={item} 
        mode="light" 
        isVisible={viewableItems.has(item.id)}
      />
    )}
    onViewableItemsChanged={onViewableItemsChanged}
    viewabilityConfig={viewabilityConfig}
    // ... 기타 props
  />
);
```

**문제**: PostItem이 이미 렌더링된 후에야 visibility를 알 수 있음

**해결**: PostItem 내부에서 직접 처리하거나, 더 간단한 방법 사용

---

#### 방안 2: 간단한 Lazy Loading (권장 ⭐⭐)

**개념**:
- PostItem 내부에서 이미지가 있을 때만 로드
- FlatList의 기본 최적화 활용

**구현**:

```typescript
// src/components/PostItem.tsx 수정

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";

// LazyImage 컴포넌트를 PostItem 내부에 추가
const LazyImage = ({ uri, style }: { uri: string; style: any }) => {
  const { colors, borderRadius } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: colors.gray[200],
          borderRadius: borderRadius.md,
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <ActivityIndicator color={colors.gray[400]} size="small" />
        </View>
      )}
      {error ? (
        <View style={[style, {
          backgroundColor: colors.gray[200],
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            이미지 로드 실패
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={style}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </View>
  );
};

// PostItem에서 사용
{post.imageUrl && (
  <LazyImage
    uri={post.imageUrl}
    style={{
      width: '100%',
      height: 200,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    }}
  />
)}
```

**장점**:
- 구현 간단
- FlatList의 기본 최적화 활용
- 추가 라이브러리 불필요

**단점**:
- 완전한 lazy loading은 아님 (컴포넌트 렌더링 시 로드)
- 하지만 FlatList가 화면 밖 아이템을 언마운트하므로 실질적으로 lazy loading 효과

---

#### 방안 3: react-native-fast-image 사용

**개념**:
- 전용 이미지 라이브러리 사용
- 자동 캐싱 및 최적화

**설치**:
```bash
npm install react-native-fast-image
# 또는
expo install react-native-fast-image
```

**구현**:
```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: post.imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  style={style}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**장점**:
- 자동 캐싱
- 성능 최적화
- 메모리 관리 우수

**단점**:
- 추가 의존성
- Expo에서 설정 필요할 수 있음

**권장**: 방안 2 (간단한 Lazy Loading)
- 구현 간단
- 추가 라이브러리 불필요
- FlatList 최적화와 함께 충분한 효과

---

## 3. 빈 상태 개선

### 📖 개념 설명

**빈 상태(Empty State)란?**
- 데이터가 없을 때 표시하는 화면
- 사용자에게 상황을 설명하고 다음 액션을 유도

**현재 상태**:
- 기본적인 빈 상태 UI 있음
- 첫 글 작성 유도만 있음
- 추가 안내 부족

**개선 목표**:
- 사용자 참여 유도 강화
- 탐색 기능과 연계
- 온보딩과 연계

---

### 🔧 구현 방안

#### 방안 1: 온보딩 연계 + 추천 태그 (권장 ⭐)

**개념**:
- 빈 상태에서 온보딩 다시 보기 옵션
- 인기 태그 표시하여 탐색 유도
- 예시 글 보기 기능

**구현**:

```typescript
// app/index.tsx 수정

const renderEmptyState = () => {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding(); // OnboardingContext에서 가져오기

  // 인기 태그 (실제로는 Firestore에서 가져오거나 하드코딩)
  const popularTags = ["시험", "프로젝트", "인간관계", "시간관리", "커뮤니케이션"];

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    }}>
      {/* 메인 메시지 */}
      <Text style={{ fontSize: 60, marginBottom: spacing.lg }}>😅</Text>
      <Text style={[typography.h3, { 
        color: colors.text.primary, 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }]}>
        아직 실패담이 없어요
      </Text>
      <Text style={[typography.body, { 
        color: colors.text.secondary, 
        textAlign: 'center',
        marginBottom: spacing.xl 
      }]}>
        첫 번째 실패담을 공유해보세요!{'\n'}함께 성장해갈 수 있어요 🚀
      </Text>

      {/* 주요 액션 버튼 */}
      <Link href="/new" asChild>
        <Button 
          title="✍️ 첫 실패담 쓰기" 
          variant="primary"
          size="lg"
          style={{ marginBottom: spacing.md, width: '100%' }}
        />
      </Link>

      {/* 인기 태그 섹션 */}
      <View style={{ width: '100%', marginTop: spacing.xl, marginBottom: spacing.lg }}>
        <Text style={[typography.bodySmall, { 
          color: colors.text.secondary, 
          textAlign: 'center',
          marginBottom: spacing.sm 
        }]}>
          이런 실패담들이 있어요
        </Text>
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: spacing.sm 
        }}>
          {popularTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => router.push(`/explore?tag=${tag}`)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colors.gray[200],
              }}
            >
              <Text style={[typography.caption, { color: colors.text.primary }]}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/explore')}
          style={{ marginTop: spacing.sm }}
        >
          <Text style={[typography.bodySmall, { 
            color: colors.accent, 
            textAlign: 'center',
            textDecorationLine: 'underline'
          }]}>
            더 많은 태그 탐색하기 →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 온보딩 다시 보기 */}
      <TouchableOpacity
        onPress={async () => {
          // OnboardingContext의 상태 리셋 (구현 필요)
          // 또는 별도 함수로 처리
          router.push('/onboarding');
        }}
        style={{ marginTop: spacing.lg }}
      >
        <Text style={[typography.caption, { 
          color: colors.text.secondary,
          textAlign: 'center'
        }]}>
          앱 사용법 다시 보기
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

**주요 기능**:
1. **인기 태그 표시**: 사용자가 관심 있는 주제 발견
2. **태그 클릭 시 탐색 페이지 이동**: 즉시 관련 글 확인
3. **온보딩 다시 보기**: 앱 사용법 재학습

---

#### 방안 2: 예시 글 보기

**개념**:
- 빈 상태에서 예시 글(데모) 보기 기능
- 실제 글 작성 전에 어떤 형태인지 확인

**구현**:

```typescript
// 예시 글 데이터 (하드코딩 또는 Firestore에서 가져오기)
const examplePosts = [
  {
    id: 'example-1',
    title: '시험 망쳤다 😭',
    body: '벼락치기로 시험을 봤는데...',
    lessons: '벼락치기는 역시 안 된다',
    tags: ['시험', '학업'],
    likeCount: 10,
    commentCount: 3,
  },
  // ... 더 많은 예시
];

const renderEmptyState = () => (
  <View style={{ ... }}>
    {/* 기존 메시지 */}
    
    {/* 예시 글 섹션 */}
    <View style={{ width: '100%', marginTop: spacing.xl }}>
      <Text style={[typography.bodySmall, { 
        color: colors.text.secondary,
        marginBottom: spacing.sm 
      }]}>
        이런 실패담들이 있어요
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {examplePosts.map((post) => (
          <Card key={post.id} style={{ 
            width: 280, 
            marginRight: spacing.md,
            padding: spacing.md 
          }}>
            <PostItem post={post} mode="light" />
          </Card>
        ))}
      </ScrollView>
    </View>
  </View>
);
```

**장점**:
- 사용자가 기대치 설정 가능
- 참여 유도 효과 높음

**단점**:
- 예시 데이터 관리 필요
- 실제 데이터와 혼동 가능성

---

#### 방안 3: 통계 및 인사이트 표시

**개념**:
- 빈 상태에서 전체 앱 통계 표시
- 사용자 참여 동기 부여

**구현**:

```typescript
// Firestore에서 통계 가져오기 (별도 함수 필요)
const [stats, setStats] = useState({
  totalPosts: 0,
  totalUsers: 0,
  popularTags: [] as string[],
});

useEffect(() => {
  // 통계 가져오기 (한 번만)
  loadStats().then(setStats);
}, []);

const renderEmptyState = () => (
  <View style={{ ... }}>
    {/* 기존 메시지 */}
    
    {/* 통계 표시 */}
    {stats.totalPosts > 0 && (
      <View style={{ 
        marginTop: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        width: '100%'
      }}>
        <Text style={[typography.bodySmall, { 
          color: colors.text.secondary,
          textAlign: 'center',
          marginBottom: spacing.sm
        }]}>
          지금까지 {stats.totalPosts}개의 실패담이 공유되었어요
        </Text>
        <Text style={[typography.caption, { 
          color: colors.text.secondary,
          textAlign: 'center'
        }]}>
          당신의 실패담도 함께해요! 💪
        </Text>
      </View>
    )}
  </View>
);
```

---

### 🎯 권장 구현 조합

**최종 권장 방안**:
- **인기 태그 표시** (방안 1)
- **온보딩 다시 보기** (방안 1)
- **통계 표시** (방안 3, 선택사항)

**구현 순서**:
1. 인기 태그 표시 (가장 중요)
2. 태그 클릭 시 탐색 페이지 이동
3. 온보딩 다시 보기 버튼
4. 통계 표시 (선택사항)

---

## 📊 구현 난이도 및 예상 시간

| 기능 | 난이도 | 예상 시간 | 우선순위 |
|------|--------|----------|---------|
| 페이지네이션 | 중간 | 4-6시간 | 높음 |
| 이미지 Lazy Loading | 낮음 | 2-3시간 | 중간 |
| 빈 상태 개선 | 낮음 | 2-3시간 | 중간 |

**총 예상 시간**: 8-12시간 (1-2일)

---

## ⚠️ 주의사항

### 페이지네이션
1. **Firestore 인덱스 필수**
   - `firestore.indexes.json`에 추가
   - 배포 전 인덱스 생성 확인

2. **실시간 업데이트 처리**
   - 새 글이 추가되면 첫 페이지에 자동 추가
   - 페이지네이션과 충돌 가능
   - 해결: 새 글은 별도 관리 또는 페이지 리셋

3. **정렬 모드 변경**
   - 정렬 모드 변경 시 페이지네이션 리셋 필요

### 이미지 Lazy Loading
1. **에러 처리**
   - 이미지 로드 실패 시 placeholder 표시
   - 사용자 경험 저하 방지

2. **성능**
   - 너무 많은 이미지 동시 로드 방지
   - FlatList의 기본 최적화 활용

### 빈 상태 개선
1. **데이터 로딩**
   - 인기 태그는 Firestore에서 가져오거나 하드코딩
   - 통계는 별도 쿼리 필요

2. **네비게이션**
   - 태그 클릭 시 탐색 페이지로 올바르게 이동
   - 쿼리 파라미터 처리 필요

---

## 🚀 구현 체크리스트

### 페이지네이션
- [ ] `listenFeedPaginated` 함수 구현
- [ ] `loadNextPage` 함수 구현
- [ ] 피드 화면에 페이지네이션 로직 추가
- [ ] `onEndReached` 핸들러 구현
- [ ] 로딩 상태 표시 (ListFooterComponent)
- [ ] Firestore 인덱스 추가
- [ ] 정렬 모드 변경 시 리셋 처리
- [ ] 공감순 정렬 처리 (인덱스 또는 클라이언트 정렬)

### 이미지 Lazy Loading
- [ ] LazyImage 컴포넌트 생성 (또는 PostItem 내부 구현)
- [ ] PostItem에 LazyImage 적용
- [ ] 로딩 placeholder 표시
- [ ] 에러 처리
- [ ] (선택) react-native-fast-image 적용

### 빈 상태 개선
- [ ] 인기 태그 데이터 준비 (하드코딩 또는 Firestore)
- [ ] 빈 상태 UI 개선
- [ ] 태그 클릭 시 탐색 페이지 이동
- [ ] 온보딩 다시 보기 기능
- [ ] (선택) 통계 표시
- [ ] (선택) 예시 글 보기

---

**작성일**: 2025-01-XX  
**다음 단계**: 구현 시작

