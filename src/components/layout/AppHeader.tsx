import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

interface AppHeaderProps {
  title?: string;
  showActions?: boolean;
}

export default function AppHeader({ title = "작은 실패 갤러리", showActions = true }: AppHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.background.light,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Link href="/" asChild>
          <TouchableOpacity style={{ padding: spacing.xs }}>
            <Ionicons name="home-outline" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </Link>
        <Text style={[typography.h3, { color: colors.text.primary }]}>{title}</Text>
      </View>

      {showActions && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Link href="/explore" asChild>
            <TouchableOpacity style={{ padding: spacing.xs }}>
              <Ionicons name="search-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </Link>
          <Link href="/care" asChild>
            <TouchableOpacity style={{ padding: spacing.xs }}>
              <Ionicons name="heart-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </Link>
          <Link href="/settings" asChild>
            <TouchableOpacity style={{ padding: spacing.xs }}>
              <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </View>
  );
}

