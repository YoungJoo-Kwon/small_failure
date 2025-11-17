import React from "react";
import { View, TouchableOpacity, Text, ViewStyle } from "react-native";
import { Link, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
  onTitlePress?: () => void;
  onTitleLongPress?: () => void;
}

export default function AppHeader({
  title = "작은 실패 갤러리",
  subtitle,
  style,
  children,
  onTitlePress,
  onTitleLongPress,
}: AppHeaderProps) {
  const { colors, spacing, typography } = useTheme();
  const segments = useSegments();
  const current = `/${segments.join("/") || ""}`.replace("//", "/");
  const hasTitleHandlers = !!(onTitlePress || onTitleLongPress);

  const NavButton = ({ icon, href, active }: { icon: any; href: string; active?: boolean }) => (
    <Link href={href} asChild>
      <TouchableOpacity
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          borderRadius: spacing.sm,
          backgroundColor: active ? colors.background.surface : "transparent",
        }}
      >
        <Ionicons name={icon as any} size={20} color={colors.text.primary} />
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={style}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.background.light,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={hasTitleHandlers ? 0.7 : 1}
          disabled={!hasTitleHandlers}
          onPress={onTitlePress}
          onLongPress={onTitleLongPress}
        >
          <Text style={[typography.h3, { color: colors.text.primary }]}>{title}</Text>
          {subtitle && (
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>{subtitle}</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <NavButton icon="home-outline" href="/" active={current === "/"} />
          <NavButton icon="search-outline" href="/explore" active={current.startsWith("/explore")} />
          <NavButton icon="heart-outline" href="/care" active={current.startsWith("/care")} />
          <NavButton icon="person-circle-outline" href="/me/posts" active={current.startsWith("/me")} />
          <NavButton icon="settings-outline" href="/settings" active={current.startsWith("/settings")} />
        </View>
      </View>

      {children}
    </View>
  );
}

