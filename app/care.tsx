import React, { useState, useEffect } from "react";
import { View, Text, Switch, Linking, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../src/contexts/ThemeContext";
import Button from "../src/components/common/Button";
import Card from "../src/components/common/Card";
import { useSettings } from "../src/contexts/SettingsContext";
import AppHeader from "../src/components/AppHeader";
import { isAdmin } from "../src/lib/auth";

const careResources = [
  // 긴급 상담 (최우선)
  { 
    label: "생명의 전화", 
    number: "1588-9191",
    description: "자살 예방 24시간 상담",
    url: "tel:1588-9191",
    priority: "high" as const
  },
  { 
    label: "정신건강 위기상담", 
    number: "1577-0199",
    description: "정신건강 전문 24시간 상담",
    url: "tel:1577-0199",
    priority: "high" as const
  },
  // 일반 상담
  { 
    label: "청소년 상담", 
    number: "1388",
    description: "청소년 전용 24시간 상담",
    url: "tel:1388",
    priority: "normal" as const
  },
  // 정보 제공
  { 
    label: "서울시 청년마음건강센터", 
    description: "서울 거주 청년 대상",
    url: "https://www.seoulmindcenter.kr",
    priority: "normal" as const
  },
  { 
    label: "한국심리학회 상담센터 안내", 
    description: "상담센터 정보 제공",
    url: "https://www.koreanpsychology.or.kr",
    priority: "normal" as const
  },
];

export default function CareScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { notifyOnReply, setNotifyOnReply } = useSettings();
  const [careAlert, setCareAlert] = useState(true);
  const [careTone, setCareTone] = useState<"warm" | "calm">("warm");
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      } catch (e) {
        console.error("[CareScreen] Error checking admin status:", e);
        setIsUserAdmin(false);
      } finally {
        setLoadingAdmin(false);
      }
    })();
  }, []);

  const handleResourcePress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("열기 실패", "링크를 열 수 없습니다.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="케어 & 설정" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Text style={[typography.h3, { color: colors.text.primary }]}>케어 & 설정</Text>
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: spacing.xs }]}>
            안전한 기록을 위한 케어 설정과 앱 환경을 관리하세요.
          </Text>
        </View>

      <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
        <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>위험 키워드 감지</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
          <View>
            <Text style={[typography.body, { color: colors.text.primary }]}>위험 키워드 발견 시 안내</Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>"살고 싶지 않다" 와 같은 표현 감지 시 도움말 표시</Text>
          </View>
          <Switch value={careAlert} onValueChange={setCareAlert} trackColor={{ false: colors.gray[300], true: colors.accent }} thumbColor={careAlert ? colors.primary : colors.gray[400]} />
        </View>

        {/* 케어 톤 설정: 관리자만 볼 수 있음 */}
        {!loadingAdmin && isUserAdmin && (
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Text style={[typography.caption, { color: colors.text.secondary, marginRight: spacing.sm, alignSelf: "center" }]}>
              케어 톤:
            </Text>
            {[
              { key: "warm", label: "부드럽게" },
              { key: "calm", label: "차분하게" },
            ].map((tone) => (
              <Button
                key={tone.key}
                title={tone.label}
                size="sm"
                variant={careTone === tone.key ? "primary" : "secondary"}
                onPress={() => setCareTone(tone.key as "warm" | "calm")}
                style={careTone === tone.key ? { backgroundColor: colors.accent, borderColor: colors.accent } : {}}
              />
            ))}
          </View>
        )}
      </Card>

      <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
        <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>멘탈 케어 리소스</Text>
        {careResources.map((resource) => (
          <View key={resource.url} style={{ marginBottom: spacing.sm }}>
            <Button
              title={resource.number ? `${resource.label} ${resource.number}` : resource.label}
              variant={resource.priority === "high" ? "primary" : "secondary"}
              style={{ 
                marginBottom: spacing.xs,
                ...(resource.priority === "high" ? { 
                  backgroundColor: colors.error || "#f87171", 
                  borderColor: colors.error || "#f87171" 
                } : {})
              }}
              onPress={() => handleResourcePress(resource.url)}
            />
            {resource.description && (
              <Text style={[typography.caption, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
                {resource.description}
              </Text>
            )}
          </View>
        ))}
        <View style={{ 
          marginTop: spacing.md, 
          padding: spacing.sm, 
          backgroundColor: colors.error || "#fee2e2", 
          borderRadius: borderRadius.md 
        }}>
          <Text style={[typography.caption, { color: colors.text.primary, fontWeight: "600" }]}>
            ⚠️ 긴급 상황: 생명이 위급한 경우 112 또는 119에 바로 연락하세요.
          </Text>
        </View>
      </Card>

      <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
        <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>알림 설정</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
          <Text style={[typography.body, { color: colors.text.primary }]}>내 글 공감/댓글 알림</Text>
          <Switch value={notifyOnReply} onValueChange={setNotifyOnReply} trackColor={{ false: colors.gray[300], true: colors.accent }} thumbColor={notifyOnReply ? colors.primary : colors.gray[400]} />
        </View>
        <Button title="회고 리마인더 설정" variant="secondary" size="sm" />
      </Card>

        <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>계정 & 익명성</Text>
          <Button title="닉네임 / 아바타 변경" variant="secondary" onPress={() => router.push("/settings")} style={{ marginBottom: spacing.sm }} />
          <Button title="데이터 백업/삭제 요청" variant="secondary" style={{ marginBottom: spacing.sm }} />
          <Button title="로그아웃" variant="danger" />
        </Card>
      </ScrollView>
    </View>
  );
}

