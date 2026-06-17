import { View } from "react-native";

import { colors, radius, fontSize } from "@/lib/theme";
import { Text } from "@/components/ui/Text";
import type { RentalStatus } from "@/lib/types";

type Tone = "neutral" | "primary" | "success" | "muted";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surface, fg: colors.text },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: "#E7F1EB", fg: colors.success },
  muted: { bg: colors.surfaceAlt, fg: colors.textMuted },
};

export function Badge({ label, tone = "primary" }: BadgeProps) {
  const t = TONE[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text weight="semibold" color={t.fg} style={{ fontSize: fontSize.caption }}>
        {label}
      </Text>
    </View>
  );
}

/** Maps a rental status to a labelled, color-coded badge. */
export function statusTone(status: RentalStatus): Tone {
  switch (status) {
    case "completed":
      return "success";
    case "active":
    case "paid":
    case "approved":
      return "primary";
    case "cancelled":
    case "declined":
    case "disputed":
      return "muted";
    default:
      return "neutral";
  }
}
