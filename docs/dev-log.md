\# 개발 로그 (Dev Log)

\## 2025-09-21

\### 작업 내용
\- \*\*Input.tsx\*\*
&nbsp; - 라벨 텍스트에 `typography.bodySmall` 적용 → 폰트 일관성 확보

\- \*\*\[id].tsx (상세 페이지)\*\*
&nbsp; - 본문 내용을 흰색 카드 박스로 감싸서 가독성 강화
&nbsp; - "붙이기" 버튼 추가 → AttachModal과 연동
&nbsp; - attach 댓글 카드 렌더링 로직 추가

\- \*\*AttachModal.tsx\*\*
&nbsp; - 하단 오버레이 모달 구현
&nbsp; - 내 글/검색/붙여넣기 탭 추가
&nbsp; - 선택한 글을 댓글로 이어붙이는 기능 연동
&nbsp; - 로그인 보장(`ensureAnonSignIn`) 처리

\- \*\*Button.tsx\*\*
&nbsp; - `titleStyle` prop 지원 추가
&nbsp; - primary 버튼은 자동으로 흰색 텍스트 적용 → 버튼 대비 문제 해결

\### 에러 대응

\- Hooks 순서 오류(`Rendered fewer hooks than expected`) → useState 위치 최상단으로 이동
\- 이벤트 핸들러에서 `await` 사용 시 오류 → `onPress={async () => {...}}` 로 수정
\- 경로 오류(`../../src/lib/auth`) → `../../lib/auth` 로 수정
\- 붙이기 저장 실패 시 에러 메시지를 Alert로 표시, 디버깅 가능하게 개선

\### 현재 상태
\- 글 작성/목록/상세/댓글/공감/삭제 기능 동작 확인
\- 붙이기 기능 1차 구현 완료 (내 글 선택 → attach 댓글 추가)
\- 버튼 및 텍스트 스타일 통일, 가독성 강화
\- 에러 처리 및 로그인 보장 로직 반영

\### 다음 계획
\- attach 댓글 UI 개선 (썸네일, 태그 등 표시)
\- 검색 탭 고도화 (prefix 검색 → 풀텍스트 서비스 연동 고려)
\- 붙이기 중복 방지 및 취소 기능 추가
\- Firestore Blaze 업그레이드 후 이미지 업로드 기능 활성화

## To-Do (남은 작업 / 개선 과제)

- [ ] **붙이기(Attach) UX 개선**
  - [ ] 붙이기 취소/삭제 기능 추가
  - [ ] 동일 글 중복 붙이기 방지
  - [ ] attach 댓글 UI 개선 (썸네일, 태그 배지, 버튼 정돈)

- [ ] **검색 기능 강화**
  - [ ] 제목 prefix 검색 보완
  - [ ] 태그 검색 지원
  - [ ] 풀텍스트 검색(Algolia, Typesense 등) 연동 검토

- [ ] **공감 UX 개선**
  - [ ] 내가 공감한 글 시각적 표시
  - [ ] 공감 취소 시 피드백 강화

- [ ] **이미지 업로드**
  - [ ] Firebase Storage Blaze 업그레이드
  - [ ] 글 작성 시 이미지 업로드 활성화

- [ ] **UI/UX 디테일**
  - [ ] Alert → Toast/스낵바로 전환
  - [ ] 디자인 통일성 강화 (버튼, 카드, 타이포그래피)

- [ ] **안정성 및 보안**
  - [ ] Firestore 보안 규칙 정밀 점검 (attach 댓글, 삭제 권한 포함)
  - [ ] 네트워크 불안정/오프라인 에러 처리 보강

- [ ] **운영 준비**
  - [ ] 에러 로깅 도입 (Firebase Crashlytics or Sentry)
  - [ ] 사용자 피드백 수집 기능 (앱 내 설문/버튼)
  - [ ] 개발 로그(dev-log) 지속 기록


# Dev Log

## 2025-09-24

### 변경 사항 요약
- **전역 진입 보장**
  - `app/_layout.tsx`: `ensureAnonSignIn()` → `ensureProfileSeed()` 순차 호출
  - 헤더 우측에 **설정** 진입 버튼(아이콘/링크) 추가

- **프로필/설정**
  - `src/lib/profiles.ts`: `ensureProfileSeed`, `getMyProfile`, `updateProfile`, `updateSettings` 추가
  - `app/settings.tsx`: 닉네임/아바타/알림/테마 편집 화면 추가, 아바타 업로드 연결
  - `src/lib/storage.ts`: 웹 업로드용 `blob + contentType` 처리 보완
  - Firebase Storage **CORS 설정** 및 **Rules 수정** (`avatars/{uid}.jpg` 본인 쓰기 허용)

- **닉네임 스냅샷**
  - `lib/posts.ts`: `getAuthorSnapshot()` 공통화
  - `createPost`, `addComment`, `addAttachComment` → `authorNickname`, `authorAvatarUrl` 스냅샷 저장
  - `[id].tsx`: 글/댓글 렌더 시 닉네임 표시

- **붙이기/모달/UX**
  - `AttachModal`: 버튼 색상 테마 적용, import 경로 정리
  - `[id].tsx`: “붙이기”/댓글 등록 시 `ensureAnonSignIn()` 보장
  - `new.tsx`: 등록 성공 후 홈 화면으로 이동(`router.replace("/")`), busy 상태 해제

- **내 활동 화면**
  - `src/lib/userContent.ts`: `listenMyPosts`, `listenMyComments` 추가
  - `app/me/posts.tsx`, `app/me/comments.tsx`, `app/me/index.tsx` 스캐폴드 추가

- **Firestore Rules**
  - `profiles` 컬렉션: 본인만 쓰기 허용
  - `comments.create`: 본문/attach 허용
  - `posts.update`: 비소유자도 카운트 필드(likeCount/commentCount) 업데이트 허용

---

## 2025-01-XX (최신 업데이트)

### 주요 기능 추가

#### 1. 피드 개선 (Home Feed)
- ✅ **페이지네이션 (무한 스크롤)** 구현
  - `src/lib/posts.ts`: `listenFeedPaginated`, `loadNextPage` 함수 추가
  - Firestore 기반 커서 페이지네이션
  - `app/index.tsx`: 스크롤 끝에서 자동으로 다음 페이지 로드
  - `firestore.indexes.json`: 페이지네이션을 위한 인덱스 추가
- ✅ **글머리 필터** 추가
  - `app/index.tsx`: "공감구함", "조언구함", "혼쭐내줘" 필터링
  - 헤더에 `RequestTypeFilter` 컴포넌트 추가
- ✅ **빈 상태 개선**
  - 인기 태그 표시 및 탐색 페이지 연결
  - 온보딩 재방문 옵션 제공
- ✅ **새로고침 기능 개선**
  - 실제 데이터 재로드 구현

#### 2. 북마크 기능
- ✅ **북마크 시스템** 구현
  - `src/lib/bookmarks.ts` 새로 생성
  - `addBookmark`, `removeBookmark`, `toggleBookmark` 함수
  - `listenMyBookmarks`, `listenBookmarkStatus` 실시간 구독 함수
- ✅ **북마크 화면** 추가
  - `app/me/bookmarks.tsx` 새로 생성
  - 북마크한 게시물 목록 표시
  - `app/me/index.tsx`: 마이페이지에서 북마크 화면 접근 가능
- ✅ **PostItem에 북마크 버튼** 추가
  - `src/components/PostItem.tsx`: 북마크 버튼 및 실시간 상태 표시
- ✅ **Firestore 규칙 및 인덱스** 추가
  - `firestore.rules`: 북마크 컬렉션 보안 규칙 설정
  - `firestore.indexes.json`: 사용자별 북마크 조회 인덱스 생성

#### 3. 공감 (좋아요) 기능 개선
- ✅ **PostItem에 공감 버튼** 추가
  - `src/components/PostItem.tsx`: 공감 버튼 및 실시간 상태 표시
  - 공감 수 표시 및 토글 기능
  - 낙관적 업데이트 (Optimistic Update) 적용

#### 4. 글 수정 기능
- ✅ **상세 페이지에서 글 수정** 기능 추가
  - `src/lib/posts.ts`: `updatePost` 함수 추가
  - `app/post/[id].tsx`: 인라인 편집 UI 구현
  - 본인 글만 수정 가능
  - 수정 모드에서 댓글 섹션 숨김 처리

#### 5. 관리자 기능
- ✅ **관리자 권한 체크** 기능 추가
  - `src/lib/auth.ts`: `isAdmin` 함수 구현
  - `app/care.tsx`: "케어 톤" 설정을 관리자에게만 표시

### 기술적 개선
- ✅ Firestore 페이지네이션 인덱스 추가
- ✅ Firestore 북마크 인덱스 추가
- ✅ 쿼리 성능 최적화
- ✅ TypeScript 타입 안정성 강화
- ✅ 에러 처리 개선

### 버그 수정
- ✅ `TouchableOpacity` import 오류 수정 (`app/new.tsx`)
- ✅ 수정 모드에서 댓글 섹션 숨김 처리 (`app/post/[id].tsx`)

---

