// app/me/index.tsx
import React from "react";
import { View, Text } from "react-native";
import { useRouter, Link } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import Button from "../../src/components/common/Button";
import Card from "../../src/components/common/Card";
import AppHeader from "../../src/components/AppHeader";

export default function MeIndex() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.surface }}>
      <AppHeader title="My Growth" />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text.primary }]}>My Activity</Text>

        <Card padding="lg">
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
            <View>
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>Total Posts</Text>
              <Text style={[typography.h2, { color: colors.text.primary }]}>—</Text>
            </View>
            <View>
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>Last 30 Days</Text>
              <Text style={[typography.body, { color: colors.text.primary }]}></Text>
            </View>
            <View>
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>Top Tag</Text>
              <Text style={[typography.body, { color: colors.text.primary }]}></Text>
            </View>
          </View>
          <Button
            title="Share a new story"
            size="sm"
            onPress={() => router.push("/new")}
            style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
          />
        </Card>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button title="My Posts" onPress={() => router.push("/me/posts")} style={{ flex: 1 }} />
          <Button title="My Comments" variant="secondary" onPress={() => router.push("/me/comments")} style={{ flex: 1 }} />
        </View>

        <Button 
          title="📑 북마크" 
          variant="secondary" 
          onPress={() => router.push("/me/bookmarks")} 
          style={{ width: '100%' }}
        />

        <View style={{ gap: spacing.sm }}>
          <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>Series</Text>
            <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.xs }]}>Group your failures into themed series.</Text>
            <Button title="Manage Series" variant="secondary" onPress={() => router.push("/me/posts")} size="sm" />
          </Card>

          <Card padding="lg" style={{ backgroundColor: colors.background.light }}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}>Growth Notes</Text>
            <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.xs }]}>Review all the lessons you have written.</Text>
            <Button title="Open Notes" variant="secondary" size="sm" onPress={() => router.push("/me/notes")} />
          </Card>
        </View>

        <Link href="/settings" asChild>
          <Button title="Open Settings" variant="secondary" style={{ alignSelf: "flex-end" }} />
        </Link>
      </View>
    </View>
  );
}
