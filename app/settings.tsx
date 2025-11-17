import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, Alert, Switch, Animated, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { useTheme } from "../src/contexts/ThemeContext";
import { useSettings } from "../src/contexts/SettingsContext";
import Input from "../src/components/common/Input";
import Button from "../src/components/common/Button";
import Card from "../src/components/common/Card";

import { ensureAnonSignIn } from "../src/lib/auth";
import { ensureProfileSeed, getMyProfile, updateProfile, UserProfile } from "../src/lib/profiles";
import { auth } from "../src/lib/firebase";
import { uploadImageFromUri } from "../src/lib/storage";
import { DEFAULT_AVATAR_NAMES, DEFAULT_AVATAR_MODULES, createDefaultAvatarId, getAvatarSource } from "../src/lib/avatars";
import { invalidateProfileCache } from "../src/lib/avatarHelper";

import { changeNicknameFreePlan } from "../src/lib/nickChange";
import { devResetCurrentSeed } from "../src/dev/resetSeed"; // ★ dev 트리거
import AppHeader from "../src/components/AppHeader";

type ThemeOption = "system" | "light" | "dark";

// 규칙과 일치하는 1차 검증
const NICK_RE = /^[a-z0-9._\-가-힣]{2,20}$/;
const BLOCKED_RE = /(시발|fuck|sex|admin|운영자)/i;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius, theme, setTheme, loading: themeLoading } = useTheme();
  const { notifyOnReply, setNotifyOnReply, loading: settingsLoading } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 프로필
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [editingNick, setEditingNick] = useState(false); // ★ 편집 모드

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // 토스트
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        await ensureAnonSignIn();
        await ensureProfileSeed(7);
        const p = await getMyProfile();
        if (p) hydrateFromProfile(p);
      } catch (e: any) {
        console.error("settings init failed:", e?.message ?? e);
        Alert.alert("오류", "개인 설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function hydrateFromProfile(p: UserProfile) {
    const name = p.displayName || "";
    setDisplayName(name);
    setOriginalName(name);
    setAvatarUrl(p.avatarUrl ?? null);
    
    // 기본 아바타인 경우 선택 상태 복원
    if (p.avatarUrl && p.avatarUrl.startsWith("default:")) {
      const name = p.avatarUrl.substring("default:".length);
      if (DEFAULT_AVATAR_NAMES.includes(name as any)) {
        setSelectedDefaultAvatar(name);
      }
    }
    
    // 테마와 알림 설정은 Context에서 자동으로 로드됨
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("권한 필요", "아바타를 변경하려면 사진 접근 권한이 필요합니다.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (!result.canceled) {
      setPreviewUri(result.assets[0].uri);
      setSelectedDefaultAvatar(null); // 기본 아바타 선택 해제
    }
  }

  // 닉네임 저장(편집 모드에서만 호출)
  async function saveNickname() {
    const input = displayName.trim();
    if (!input) return Alert.alert("안내", "닉네임을 입력해 주세요.");
    if (!NICK_RE.test(input)) return Alert.alert("안내", "닉네임은 2–20자, 한글/영문 소문자/숫자/._-만 사용할 수 있어요.");
    if (BLOCKED_RE.test(input)) return Alert.alert("안내", "사용할 수 없는 단어가 포함되어 있어요.");
    if (input.toLowerCase() === originalName.toLowerCase()) {
      setEditingNick(false);
      return showToast("변경 사항이 없습니다.");
    }

    setSaving(true);
    try {
      await changeNicknameFreePlan(input);
      const p = await getMyProfile();
      if (p?.displayName) {
        setOriginalName(p.displayName);
        setDisplayName(p.displayName);
      }
      setEditingNick(false);
      showToast("닉네임이 변경되었어요!");
    } catch (e:any) {
      console.error("nickname change failed:", e?.message ?? e);
      Alert.alert("오류", e?.message ?? "닉네임 변경에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  // 아바타 저장 (테마와 알림은 Context에서 자동 저장됨)
  async function saveAll() {
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      const uid = auth.currentUser?.uid ?? "anon";
      
      // 기본 아바타가 선택된 경우
      if (selectedDefaultAvatar && DEFAULT_AVATAR_NAMES.includes(selectedDefaultAvatar as any)) {
        finalAvatarUrl = createDefaultAvatarId(selectedDefaultAvatar as any);
        console.log("[saveAll] Using default avatar:", finalAvatarUrl);
      } 
      // 커스텀 이미지가 선택된 경우 (갤러리에서 선택)
      else if (previewUri) {
        console.log("[saveAll] Uploading custom avatar...");
        const filename = `avatars/${uid}.jpg`;
        finalAvatarUrl = await uploadImageFromUri(previewUri, filename);
        console.log("[saveAll] Custom avatar uploaded");
      }
      // 변경 사항이 없는 경우 기존 avatarUrl 유지

      console.log("[saveAll] Updating profile, finalAvatarUrl:", finalAvatarUrl);
      await updateProfile({ avatarUrl: finalAvatarUrl ?? null } as any);
      console.log("[saveAll] Profile updated");

      setAvatarUrl(finalAvatarUrl ?? null);
      setPreviewUri(null);
      setSelectedDefaultAvatar(null);
      
      // 프로필 캐시 무효화하여 기존 게시물/댓글의 아바타도 업데이트
      if (uid) {
        invalidateProfileCache(uid);
      }
      
      showToast("저장 완료!");
    } catch (e:any) {
      console.error("[saveAll] Save failed:", e);
      console.error("[saveAll] Error message:", e?.message);
      console.error("[saveAll] Error stack:", e?.stack);
      Alert.alert("오류", e?.message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // 테마 변경 핸들러
  const handleThemeChange = async (newTheme: ThemeOption) => {
    try {
      await setTheme(newTheme);
      showToast(`테마가 ${newTheme === 'system' ? '시스템' : newTheme === 'light' ? '라이트' : '다크'}로 변경되었어요!`);
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "테마 변경에 실패했습니다.");
    }
  };

  // 알림 설정 변경 핸들러
  const handleNotifyChange = async (value: boolean) => {
    try {
      await setNotifyOnReply(value);
      // 토스트는 Context에서 처리하거나 여기서 처리 가능
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "알림 설정 변경에 실패했습니다.");
    }
  };

  // ★ dev 트리거: 제목 길게 누르면 시딩 리셋
  async function onLongPressTitle() {
    Alert.alert(
      "개발자 기능",
      "현재 프로필과 닉네임 인덱스를 초기화할까요? (다음 진입 시 새 유저로 시딩됩니다)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            try {
              await devResetCurrentSeed();
              showToast("초기화 완료! 앱을 재진입합니다.");
              // 홈으로 이동(부팅 루틴에서 ensureProfileSeed가 다시 실행)
              router.replace("/");
            } catch (e:any) {
              Alert.alert("오류", e?.message ?? "초기화에 실패했습니다.");
            }
          },
        },
      ]
    );
  }

  const isLoading = loading || themeLoading || settingsLoading;

  // 기본 아바타 선택 상태 (파일명으로 관리)
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader
        title="개인 설정"
        subtitle="닉네임, 아바타, 알림 등 기본 설정을 관리하세요."
        onTitleLongPress={onLongPressTitle}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {isLoading ? (
          <View style={{ paddingVertical: spacing.xl }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            {/* 프로필 카드 */}
            <Card style={{ marginTop: spacing.lg, marginBottom: spacing.lg, padding: spacing.lg }}>
              <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.md }]}>
                프로필
              </Text>

              {/* 아바타 */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 80, height: 80, borderRadius: 9999,
                    backgroundColor: colors.gray[200], overflow: "hidden",
                    marginRight: spacing.md, alignItems: "center", justifyContent: "center",
                    borderWidth: 1, borderColor: colors.gray[300],
                  }}
                >
                  {(() => {
                    // 1. 기본 아바타가 선택된 경우 (미리보기)
                    if (selectedDefaultAvatar && DEFAULT_AVATAR_NAMES.includes(selectedDefaultAvatar as any)) {
                      const module = DEFAULT_AVATAR_MODULES[selectedDefaultAvatar as keyof typeof DEFAULT_AVATAR_MODULES];
                      if (module) {
                        console.log("[Settings] Preview: default avatar", selectedDefaultAvatar);
                        return (
                          <Image source={module} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        );
                      } else {
                        console.warn("[Settings] Default avatar module not found:", selectedDefaultAvatar);
                      }
                    }
                    // 2. 커스텀 이미지 미리보기
                    else if (previewUri) {
                      console.log("[Settings] Preview: custom image");
                      return (
                        <Image source={{ uri: previewUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      );
                    }
                    // 3. 저장된 아바타
                    else if (avatarUrl) {
                      const source = getAvatarSource(avatarUrl);
                      console.log("[Settings] Preview: saved avatar", avatarUrl.substring(0, 30));
                      if (source) {
                        if (source.require) {
                          return (
                            <Image source={source.require} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                          );
                        } else if (source.uri) {
                          return (
                            <Image source={{ uri: source.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                          );
                        }
                      }
                    }
                    
                    return (
                      <Text style={[typography.h4, { color: colors.text.secondary }]}>🙂</Text>
                    );
                  })()}
                </View>

                <Button title="아바타 변경" variant="secondary" onPress={pickAvatar} />
              </View>

              {/* 기본 아바타 선택 */}
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>기본 아바타</Text>
                <View style={{ flexDirection: "row", columnGap: spacing.sm }}>
                  {DEFAULT_AVATAR_NAMES.map((name) => {
                    const isSelected = selectedDefaultAvatar === name;
                    return (
                      <TouchableOpacity
                        key={name}
                        onPress={() => {
                          console.log("[Settings] Default avatar selected:", name);
                          setSelectedDefaultAvatar(name);
                          setPreviewUri(null); // 커스텀 미리보기 제거
                        }}
                        activeOpacity={0.8}
                      >
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 9999,
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: isSelected ? colors.accent : colors.gray[300],
                          }}
                        >
                          <Image 
                            source={DEFAULT_AVATAR_MODULES[name]} 
                            style={{ width: "100%", height: "100%" }} 
                            resizeMode="cover" 
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 닉네임 표시 → 편집 전환 */}
              <View style={{ marginTop: spacing.lg }}>
                {!editingNick ? (
                  <>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                      닉네임
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Text style={[typography.body, { color: colors.text.primary, marginRight: spacing.sm }]}>
                        {originalName || "익명의 작실인"}
                      </Text>
                      <Button
                        title="변경"
                        size="sm"
                        variant="secondary"
                        onPress={() => {
                          setDisplayName(originalName);
                          setEditingNick(true);
                        }}
                      />
                    </View>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                      새 글/댓글부터 적용됩니다. 기존 콘텐츠는 당시 닉네임이 유지돼요.
                    </Text>
                  </>
                ) : (
                  <>
                    <Input
                      label="새 닉네임"
                      placeholder="예: 작은실패러"
                      value={displayName}
                      onChangeText={setDisplayName}
                      maxLength={20}
                    />
                    <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                      2–20자 / 한글·영문소문자·숫자·._- 만 허용 / 금칙어·중복·쿨다운 적용
                    </Text>
                    <View style={{ flexDirection: "row", columnGap: spacing.sm, marginTop: spacing.sm }}>
                      <Button
                        title={saving ? "변경 중..." : "저장"}
                        onPress={saveNickname}
                        disabled={saving}
                        loading={saving}
                        size="sm"
                        style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
                      />
                      <Button
                        title="취소"
                        variant="secondary"
                        size="sm"
                        onPress={() => { setDisplayName(originalName); setEditingNick(false); }}
                      />
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* 설정 카드 */}
            <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
              <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.md }]}>
                앱 설정
              </Text>

              {/* 테마 */}
              <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.sm }]}>테마</Text>
              <View style={{ flexDirection: "row", columnGap: spacing.sm, marginBottom: spacing.md }}>
                {(["system", "light", "dark"] as ThemeOption[]).map((opt) => (
                  <Button
                    key={opt}
                    title={opt === "system" ? "시스템" : opt === "light" ? "라이트" : "다크"}
                    size="sm"
                    variant={theme === opt ? "primary" : "secondary"}
                    style={theme === opt ? { backgroundColor: colors.accent, borderColor: colors.accent } : undefined}
                    onPress={() => handleThemeChange(opt)}
                  />
                ))}
              </View>

              {/* 댓글 알림 */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
                <Text style={[typography.body, { color: colors.text.primary }]}>댓글 알림 받기</Text>
                <Switch 
                  value={notifyOnReply} 
                  onValueChange={handleNotifyChange}
                  trackColor={{ false: colors.gray[300], true: colors.accent }}
                  thumbColor={notifyOnReply ? colors.primary : colors.gray[400]}
                />
              </View>
            </Card>

            {/* 저장 / 뒤로 */}
            <View style={{ flexDirection: "row", columnGap: spacing.sm }}>
              <Button
                title={saving ? "저장 중..." : "저장하기"}
                onPress={saveAll}
                disabled={saving}
                loading={saving}
                size="lg"
                style={{ backgroundColor: colors.accent, borderColor: colors.accent, flex: 1 }}
              />
              <Button title="뒤로" variant="secondary" onPress={() => router.back()} size="lg" style={{ flex: 0.5 }} />
            </View>
          </>
        )}
      </ScrollView>

      {toastMsg && (
        <Animated.View
          style={{
            position: "absolute",
            left: spacing.lg, right: spacing.lg, bottom: spacing.xl,
            paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
            backgroundColor: "rgba(0,0,0,0.85)", borderRadius: borderRadius.md, opacity: toastOpacity,
            pointerEvents: "none",
          }}
        >
          <Text style={[typography.bodySmall, { color: "white", textAlign: "center" }]}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}
