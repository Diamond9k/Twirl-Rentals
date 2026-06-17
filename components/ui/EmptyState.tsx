import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { colors, spacing } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "sparkles-outline",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl * 2,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      {message ? (
        <Text variant="bodyMuted" center>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          fullWidth={false}
          size="md"
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}
