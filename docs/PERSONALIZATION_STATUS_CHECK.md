# 개인화 설정 기능 점검 리포트

**점검 기준일**: 현재 개발 단계 기준  
**점검 범위**: 닉네임, 프로필, 개인 설정 기능

---

## 📊 전체 요약

| 기능 영역 | 구현률 | 상태 | 비고 |
|----------|--------|------|------|
| 닉네임 관리 | **95%** | 🟢 거의 완료 | 쿨다운, 중복 방지 완벽 |
| 프로필 관리 | **80%** | 🟢 대부분 구현 | 아바타 OK, bio 미사용 |
| 설정 관리 | **60%** | 🟡 부분 구현 | UI만 있고 실제 적용 안 됨 |
| 인증/시딩 | **90%** | 🟢 거의 완료 | 자동 시딩 잘 동작 |

**전체 평균 구현률**: 약 **81%** 🟢

---

## 1️⃣ 닉네임 관리

### ✅ 구현 상태: **95%** (거의 완료)

#### 잘 구현된 부분

1. **자동 닉네임 시딩**
   - 위치: `src/lib/profiles.ts:45-93` (`ensureProfileSeed`)
   - 최초 방문 시 랜덤 닉네임 자동 생성
   - 트랜잭션 기반 원자적 처리 (닉네임 점유 + 프로필 생성)
   - 충돌 시 재시도 로직 (최대 6회)
   - 랜덤 닉네임 형식: `말랑한_토끼123` (형용사_명사+숫자)

2. **닉네임 변경**
   - 위치: `app/settings.tsx:91-117`, `src/lib/nickChange.ts`
   - 쿨다운 체크 (기본 7일)
   - 중복 방지 (nicknames 컬렉션 활용)
   - 유효성 검증 (2-20자, 한글/영문소문자/숫자/._-)
   - 금칙어 필터링
   - 트랜잭션 기반 안전한 변경
   - 이전 닉네임 자동 반납

3. **닉네임 정규화**
   - 위치: `src/lib/profiles.ts:25-27`, `src/lib/nickChange.ts:5`
   - 소문자 변환 + 트림
   - Firestore 규칙과 일치하는 검증

4. **UI/UX**
   - 위치: `app/settings.tsx:214-269`
   - 편집 모드 전환
   - 실시간 검증 메시지
   - 저장 중 상태 표시
   - 토스트 메시지 피드백

#### ⚠️ 개선 가능한 부분

1. **쿨다운 남은 시간 표시**
   - 현재: 쿨다운 중이면 에러만 표시
   - 개선: "X일 후 변경 가능" 메시지 표시

2. **닉네임 히스토리**
   - 현재: 변경 이력 없음
   - 개선: 이전 닉네임 목록 표시 (선택사항)

### 구현 상태: **95%** ✅

**주요 강점**:
- 트랜잭션 기반 안전한 처리
- 중복 방지 메커니즘 완벽
- 쿨다운 시스템 잘 구현됨

---

## 2️⃣ 프로필 관리

### ✅ 구현 상태: **80%** (대부분 구현)

#### 잘 구현된 부분

1. **프로필 데이터 구조**
   - 위치: `src/lib/profiles.ts:13-22`
   - 타입 정의: `UserProfile`
   - 필드: `displayName`, `avatarUrl`, `bio`, `settings`, `createdAt`, `updatedAt`

2. **프로필 생성 및 업데이트**
   - 위치: `src/lib/profiles.ts:45-104`
   - 자동 시딩: `ensureProfileSeed`
   - 프로필 업데이트: `updateProfile` (displayName 제외)
   - 프로필 조회: `getMyProfile`

3. **아바타 관리**
   - 위치: `app/settings.tsx:81-88, 119-142`
   - 이미지 선택 기능 ✅
   - Firebase Storage 업로드 ✅
   - 미리보기 표시 ✅
   - 저장 기능 ✅

4. **프로필 스냅샷**
   - 위치: `src/lib/posts.ts:45-59` (`getAuthorSnapshot`)
   - 글/댓글 작성 시 닉네임/아바타 스냅샷 저장
   - 기존 콘텐츠의 닉네임 유지 (역사성 보존)

#### ⚠️ 부분 구현/미사용

1. **프로필 bio 필드**
   - 타입에는 있지만 UI에서 사용 안 됨
   - 마이페이지에 자기소개 표시 기능 없음

2. **프로필 공개 정보**
   - 다른 사용자의 프로필 조회 기능 없음
   - 프로필 카드 뷰 없음

### 구현 상태: **80%** 🟢

**개선 필요 사항**:
- [ ] bio 필드 UI 추가 (선택사항)
- [ ] 다른 사용자 프로필 조회 기능 (선택사항)

---

## 3️⃣ 개인 설정 관리

### ⚠️ 구현 상태: **60%** (부분 구현)

#### ✅ 잘 구현된 부분

1. **설정 데이터 구조**
   - 위치: `src/lib/profiles.ts:7-11`
   - 타입 정의: `UserSettings`
   - 필드: `theme`, `locale`, `notifyOnReply`

2. **설정 UI**
   - 위치: `app/settings.tsx:272-298`
   - 테마 선택: system/light/dark ✅
   - 댓글 알림 토글 ✅
   - 설정 저장 기능 ✅

3. **설정 저장**
   - 위치: `src/lib/profiles.ts:107-118` (`updateSettings`)
   - Firestore에 중첩 필드로 저장
   - 트랜잭션 안전성 보장

#### ❌ 문제점: 설정이 실제로 적용되지 않음

1. **테마 설정 미적용**
   - 문제: 테마를 선택하고 저장해도 실제 다크모드가 적용 안 됨
   - 현재: `src/styles/theme.ts`는 정적 색상만 정의
   - 해결 필요:
     - 설정 읽기 (앱 시작 시 `getMyProfile()`)
     - Context API 또는 전역 상태로 테마 관리
     - `useColorScheme` 훅으로 시스템 테마 감지
     - 다크모드 색상 실제 적용

2. **댓글 알림 설정 미적용**
   - 문제: 알림 토글은 있지만 실제 푸시 알림 기능 없음
   - 현재: 설정만 저장됨
   - 해결 필요:
     - Firebase Cloud Messaging (FCM) 연동
     - Cloud Functions에서 댓글 작성 시 알림 발송
     - 클라이언트에서 알림 권한 요청 및 처리

3. **설정 동기화 없음**
   - 문제: 설정 화면을 벗어나면 설정이 무시됨
   - 해결 필요:
     - 앱 전역에서 설정 읽기
     - 설정 변경 시 실시간 반영

### 구현 상태: **60%** 🟡

**개선 필요 사항**:
- [ ] 테마 설정 실제 적용 (Context API + 다크모드 색상)
- [ ] 댓글 알림 기능 구현 (FCM 연동)
- [ ] 설정 전역 동기화

---

## 4️⃣ 인증 및 자동 시딩

### ✅ 구현 상태: **90%** (거의 완료)

#### 잘 구현된 부분

1. **익명 인증**
   - 위치: `src/lib/auth.ts:5-16` (`ensureAnonSignIn`)
   - 자동 익명 로그인
   - 세션 유지

2. **자동 프로필 시딩**
   - 위치: `app/_layout.tsx:19-36`
   - 앱 시작 시 자동 실행
   - React 18 StrictMode 대응 (bootedRef)
   - 에러 핸들링

3. **Firestore 보안 규칙**
   - 위치: `firestore.rules`
   - 닉네임 중복 방지 규칙 ✅
   - 프로필 접근 권한 규칙 ✅
   - 카운트 필드 변경 금지 ✅

#### ⚠️ 개선 가능한 부분

1. **세션 만료 처리**
   - 현재: 세션 만료 시 재로그인 자동?
   - 확인 필요: 익명 인증 세션 만료 정책

2. **에러 복구**
   - 현재: 에러 발생 시 사용자 안내 부족
   - 개선: 재시도 UI 제공

### 구현 상태: **90%** ✅

---

## 📋 기술적 구현 상세

### 데이터 구조

```typescript
// profiles/{uid}
{
  displayName: string;           // 정규화된 닉네임
  avatarUrl: string | null;
  bio?: string;                  // 미사용
  settings: {
    theme: "light" | "dark" | "system";
    locale?: string;
    notifyOnReply?: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastNickChangeAt: Timestamp;
  changeCooldownDays: number;    // 기본 7일
}

// nicknames/{handle} (인덱스)
{
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 핵심 로직 플로우

#### 닉네임 변경 플로우
1. 사용자가 새 닉네임 입력
2. 클라이언트 검증 (정규식, 금칙어)
3. `changeNicknameFreePlan` 호출
4. 트랜잭션 시작:
   - 쿨다운 체크
   - 새 닉네임 점유 확인
   - 새 닉네임 인덱스 생성
   - 프로필 업데이트 (displayName, lastNickChangeAt)
   - 이전 닉네임 인덱스 삭제
5. 트랜잭션 커밋
6. UI 업데이트

#### 프로필 시딩 플로우
1. 앱 시작 (`_layout.tsx`)
2. `ensureAnonSignIn` 호출
3. `ensureProfileSeed` 호출
4. 트랜잭션 시작:
   - 프로필 존재 확인 (멱등)
   - 랜덤 닉네임 생성
   - 닉네임 인덱스 점유 시도 (충돌 시 재시도)
   - 프로필 생성
5. 트랜잭션 커밋

---

## 🔴 발견된 문제점

### 1. 테마 설정이 실제로 적용되지 않음

**현재 상태**:
- 설정 화면에서 테마를 선택하고 저장 가능 ✅
- 하지만 실제 다크모드가 적용 안 됨 ❌

**문제 원인**:
```typescript
// src/styles/theme.ts
export const colors = {
  // 정적 색상만 정의됨
  // 설정에 따라 동적으로 변경되지 않음
};
```

**해결 방향**:
1. Context API로 테마 상태 관리
2. `getMyProfile()`로 설정 로드
3. 테마에 따른 동적 색상 적용
4. 시스템 테마 감지 (`useColorScheme`)

**예시 구현 방향**:
```typescript
// src/contexts/ThemeContext.tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark' | 'system';
  colors: ColorScheme;
}>();

// app/_layout.tsx에서 설정 읽고 Context 제공
```

### 2. 댓글 알림 설정만 저장되고 기능 없음

**현재 상태**:
- 설정 화면에서 알림 토글 가능 ✅
- 하지만 실제 푸시 알림 기능 없음 ❌

**해결 방향**:
1. Firebase Cloud Messaging (FCM) 설정
2. Cloud Functions에서 댓글 작성 시 알림 트리거
3. 클라이언트에서 알림 권한 요청
4. 알림 수신 및 처리

### 3. 프로필 bio 필드 미사용

**현재 상태**:
- 타입에는 `bio` 필드 존재 ✅
- 하지만 UI에서 사용 안 됨 ❌

**해결 방향**:
- 선택사항 (우선순위 낮음)
- 마이페이지에 자기소개 섹션 추가

---

## 🎯 권장 개선 방향

### 🔴 높은 우선순위 (핵심 기능)

1. **테마 설정 실제 적용**
   - Context API 도입
   - 다크모드 색상 실제 적용
   - 시스템 테마 감지
   - 예상 작업 시간: 4-6시간

2. **설정 전역 동기화**
   - 앱 시작 시 설정 로드
   - 설정 변경 시 실시간 반영
   - 예상 작업 시간: 2-3시간

### 🟡 중간 우선순위 (UX 개선)

3. **쿨다운 남은 시간 표시**
   - 닉네임 변경 UI에 남은 시간 표시
   - 예상 작업 시간: 1-2시간

4. **프로필 bio 필드 활용**
   - 마이페이지에 자기소개 섹션
   - 예상 작업 시간: 2-3시간

### 🟢 낮은 우선순위 (고급 기능)

5. **댓글 알림 기능**
   - FCM 연동
   - Cloud Functions 알림 트리거
   - 예상 작업 시간: 8-12시간

6. **다른 사용자 프로필 조회**
   - 프로필 카드 뷰
   - 예상 작업 시간: 4-6시간

---

## 💡 기술적 제안

### 1. 테마 관리 아키텍처

```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getMyProfile } from '../lib/profiles';
import { getModeStyles } from '../styles/theme';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  actualTheme: 'light' | 'dark';
  colors: ReturnType<typeof getModeStyles>;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await getMyProfile();
      if (profile?.settings?.theme) {
        setTheme(profile.settings.theme);
      }
      setLoading(false);
    })();
  }, []);

  const actualTheme = theme === 'system' 
    ? (systemTheme === 'dark' ? 'dark' : 'light')
    : theme;

  const colors = getModeStyles(actualTheme === 'light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

### 2. 설정 전역 동기화

```typescript
// src/contexts/SettingsContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getMyProfile, updateSettings } from '../lib/profiles';

const SettingsContext = createContext<{
  notifyOnReply: boolean;
  setNotifyOnReply: (v: boolean) => Promise<void>;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [notifyOnReply, setNotifyOnReplyState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await getMyProfile();
      if (profile?.settings?.notifyOnReply !== undefined) {
        setNotifyOnReplyState(profile.settings.notifyOnReply);
      }
      setLoading(false);
    })();
  }, []);

  const setNotifyOnReply = async (v: boolean) => {
    await updateSettings({ notifyOnReply: v });
    setNotifyOnReplyState(v);
  };

  return (
    <SettingsContext.Provider value={{ notifyOnReply, setNotifyOnReply }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
```

### 3. 닉네임 변경 쿨다운 표시

```typescript
// app/settings.tsx에 추가
function getCooldownMessage(profile: UserProfile | null): string | null {
  if (!profile?.lastNickChangeAt) return null;
  const cooldownDays = profile.changeCooldownDays ?? 7;
  const lastChange = profile.lastNickChangeAt.toMillis();
  const nextAvailable = lastChange + cooldownDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  if (now >= nextAvailable) return null;
  
  const daysLeft = Math.ceil((nextAvailable - now) / (24 * 60 * 60 * 1000));
  return `${daysLeft}일 후 변경 가능합니다.`;
}
```

---

## 📊 종합 평가

### 강점 ✅

1. **안전한 닉네임 관리**
   - 트랜잭션 기반 처리
   - 중복 방지 완벽
   - 쿨다운 시스템 잘 구현

2. **자동화된 사용자 온보딩**
   - 자동 익명 로그인
   - 자동 프로필 시딩
   - 사용자 개입 최소화

3. **데이터 무결성**
   - Firestore 보안 규칙 잘 설정
   - 스냅샷 기반 닉네임 유지

### 개선 필요 ⚠️

1. **설정 실제 적용**
   - 테마/알림 설정이 저장만 되고 적용 안 됨
   - 전역 상태 관리 필요

2. **사용자 피드백**
   - 쿨다운 남은 시간 표시
   - 설정 변경 즉시 반영

3. **기능 완성도**
   - 알림 기능 미구현
   - 프로필 bio 미사용

---

## 🎯 결론

**현재 상태**: 개인화 설정 기능은 **약 81% 구현**되어 있으며, 핵심 기능(닉네임 관리, 프로필 관리)은 잘 구현되어 있습니다.

**주요 문제**: 설정이 저장되지만 실제로 앱에 적용되지 않는 점이 가장 큰 이슈입니다.

**다음 단계 권장사항**:
1. 테마 설정 실제 적용 (Context API 도입)
2. 설정 전역 동기화
3. 쿨다운 표시 개선

전체적으로 안정적이고 확장 가능한 구조로 잘 설계되어 있습니다! 🎉

---

**작성일**: 2025-01-XX  
**점검 기준**: 현재 코드베이스 상태
