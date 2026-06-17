import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface HeaderProps {
  title?: string;
  /** Show a back chevron (crimson, as in the mocks). */
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}

/** Centered serif title with a crimson back chevron — the app's standard nav bar. */
export function Header({ title, back, onBack, right }: HeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SCREEN_PADDING,
        paddingVertical: spacing.md,
        minHeight: 52,
      }}
    >
      <View style={{ width: 60, alignItems: "flex-start" }}>
        {back ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <Text variant="title" numberOfLines={1} style={{ flex: 1, textAlign: "center" }}>
        {title ?? ""}
      </Text>

      <View style={{ width: 60, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
