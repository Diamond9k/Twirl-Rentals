import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { colors, radius, fontSize } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { lg: 56, md: 48, sm: 40 };

export function Button({
  title,
  variant = "primary",
  size = "lg",
  loading,
  disabled,
  fullWidth = true,
  leftIcon,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, bgPressed: colors.primaryDark, fg: colors.white, border: "transparent" },
    danger: { bg: colors.primary, bgPressed: colors.primaryDark, fg: colors.white, border: "transparent" },
    secondary: { bg: "transparent", bgPressed: colors.primarySoft, fg: colors.primary, border: colors.primary },
    ghost: { bg: "transparent", bgPressed: colors.surfaceAlt, fg: colors.text, border: colors.border },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: HEIGHT[size],
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 24,
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderWidth: palette.border === "transparent" ? 0 : 1.5,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "center",
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text
            weight="semibold"
            color={palette.fg}
            style={{ fontSize: size === "sm" ? fontSize.body : fontSize.base }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
