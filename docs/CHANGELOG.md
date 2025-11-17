# 변경 이력 (Changelog)

## [최신 업데이트] 2025-01-XX

### 🎉 주요 기능 추가

#### 1. 피드 개선 (Home Feed)
- ✅ **페이지네이션 (무한 스크롤)** 구현
  - Firestore 기반 커서 페이지네이션
  - `listenFeedPaginated`, `loadNextPage` 함수 추가
  - 스크롤 끝에서 자동으로 다음 페이지 로드
- ✅ **글머리 필터** 추가
  - "공감구함", "조언구함", "혼쭐내줘" 필터링
  - 헤더에 필터 버튼 추가
- ✅ **빈 상태 개선**
  - 인기 태그 표시 및 탐색 페이지 연결
  - 온보딩 재방문 옵션 제공
- ✅ **새로고침 기능 개선**
  - 실제 데이터 재로드 구현

#### 2. 북마크 기능
- ✅ **북마크 시스템** 구현
  - `src/lib/bookmarks.ts` 새로 생성
  - 게시물 북마크/북마크 해제 기능
  - 실시간 북마크 상태 구독
- ✅ **북마크 화면** 추가
  - `app/me/bookmarks.tsx` 새로 생성
  - 북마크한 게시물 목록 표시
  - 마이페이지에서 북마크 화면 접근 가능
- ✅ **Firestore 규칙 및 인덱스** 추가
  - 북마크 컬렉션 보안 규칙 설정
  - 사용자별 북마크 조회 인덱스 생성

#### 3. 공감 (좋아요) 기능 개선
- ✅ **PostItem에 공감 버튼** 추가
  - 실시간 공감 상태 표시
  - 공감 수 표시 및 토글 기능
  - 낙관적 업데이트 (Optimistic Update) 적용

#### 4. 글 수정 기능
- ✅ **상세 페이지에서 글 수정** 기능 추가
  - 본인 글만 수정 가능
  - 인라인 편집 UI 구현
  - 수정 모드에서 댓글 섹션 숨김
  - `updatePost` 함수 추가 (`src/lib/posts.ts`)

#### 5. 관리자 기능
- ✅ **관리자 권한 체크** 기능 추가
  - `isAdmin` 함수 구현 (`src/lib/auth.ts`)
  - "케어 톤" 설정을 관리자에게만 표시

### 🔧 기술적 개선

#### Firestore 최적화
- ✅ 페이지네이션을 위한 인덱스 추가
- ✅ 북마크 컬렉션 인덱스 추가
- ✅ 쿼리 성능 최적화

#### 코드 품질
- ✅ TypeScript 타입 안정성 강화
- ✅ 에러 처리 개선
- ✅ 컴포넌트 재사용성 향상

### 🐛 버그 수정
- ✅ `TouchableOpacity` import 오류 수정 (`app/new.tsx`)
- ✅ 수정 모드에서 댓글 섹션 숨김 처리

---

## [이전 업데이트] 2025-09-24

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
  - `[id].tsx`: "붙이기"/댓글 등록 시 `ensureAnonSignIn()` 보장
  - `new.tsx`: 등록 성공 후 홈 화면으로 이동(`router.replace("/")`), busy 상태 해제

- **내 활동 화면**
  - `src/lib/userContent.ts`: `listenMyPosts`, `listenMyComments` 추가
  - `app/me/posts.tsx`, `app/me/comments.tsx`, `app/me/index.tsx` 스캐폴드 추가

- **Firestore Rules**
  - `profiles` 컬렉션: 본인만 쓰기 허용
  - `comments.create`: 본문/attach 허용
  - `posts.update`: 비소유자도 카운트 필드(likeCount/commentCount) 업데이트 허용

---

## [이전 업데이트] 2025-09-21

### 작업 내용
- **Input.tsx**
  - 라벨 텍스트에 `typography.bodySmall` 적용 → 폰트 일관성 확보

- **[id].tsx (상세 페이지)**
  - 본문 내용을 흰색 카드 박스로 감싸서 가독성 강화
  - "붙이기" 버튼 추가 → AttachModal과 연동
  - attach 댓글 카드 렌더링 로직 추가

- **AttachModal.tsx**
  - 하단 오버레이 모달 구현
  - 내 글/검색/붙여넣기 탭 추가
  - 선택한 글을 댓글로 이어붙이는 기능 연동
  - 로그인 보장(`ensureAnonSignIn`) 처리

- **Button.tsx**
  - `titleStyle` prop 지원 추가
  - primary 버튼은 자동으로 흰색 텍스트 적용 → 버튼 대비 문제 해결

### 에러 대응
- Hooks 순서 오류(`Rendered fewer hooks than expected`) → useState 위치 최상단으로 이동
- 이벤트 핸들러에서 `await` 사용 시 오류 → `onPress={async () => {...}}` 로 수정
- 경로 오류(`../../src/lib/auth`) → `../../lib/auth` 로 수정
- 붙이기 저장 실패 시 에러 메시지를 Alert로 표시, 디버깅 가능하게 개선

---

## 구현된 주요 기능 목록

### ✅ 핵심 기능
- [x] 글 작성/읽기/수정/삭제
- [x] 댓글 작성/삭제
- [x] 공감 (좋아요) 기능
- [x] 실패 붙이기 (Attach) 기능
- [x] 검색 기능 (키워드, 태그)
- [x] 북마크 기능
- [x] 페이지네이션 (무한 스크롤)
- [x] 글머리 필터

### ✅ 사용자 관리
- [x] 프로필 관리 (닉네임, 아바타)
- [x] 설정 관리 (테마, 알림)
- [x] 온보딩 플로우
- [x] 관리자 권한 체크

### ✅ UI/UX
- [x] 다크모드 지원
- [x] 반응형 레이아웃
- [x] 일관된 디자인 시스템
- [x] 로딩 상태 관리
- [x] 에러 처리

### 🔄 진행 중 / 계획 중
- [ ] 이미지 업로드 기능
- [ ] 위험 키워드 감지 로직
- [ ] 시리즈 기능
- [ ] 타임라인 기능
- [ ] 통계 그래프
- [ ] 푸시 알림
- [ ] 에러 로깅 (Crashlytics)
- [ ] 사용자 분석 (Analytics)

