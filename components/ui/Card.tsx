import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

import { colors, radius, shadow, spacing } from "@/lib/theme";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  flat?: boolean;
}

export function Card({ children, style, padded = true, flat }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: padded ? spacing.lg : 0,
          borderWidth: 1,
          borderColor: colors.border,
        },
        !flat && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
