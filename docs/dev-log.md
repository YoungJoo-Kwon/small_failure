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



