import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors, fonts, fontSize } from "@/lib/theme";

type Variant =
  | "hero" // big serif (wordmark, "$40")
  | "display" // serif screen titles
  | "title" // serif section / card titles
  | "subtitle" // medium sans
  | "body"
  | "bodyMuted"
  | "label" // form labels / section captions (uppercase handled by caller)
  | "caption"
  | "link";

interface AppTextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  weight?: "regular" | "medium" | "semibold" | "bold";
}

const VARIANT: Record<
  Variant,
  { fontFamily?: string; fontSize: number; color: string; lineHeight?: number }
> = {
  hero: { fontFamily: fonts.serifBold, fontSize: fontSize.hero, color: colors.wine, lineHeight: 40 },
  display: { fontFamily: fonts.serifSemibold, fontSize: fontSize.display, color: colors.wine, lineHeight: 34 },
  title: { fontFamily: fonts.serifSemibold, fontSize: fontSize.xl, color: colors.text, lineHeight: 28 },
  subtitle: { fontSize: fontSize.lg, color: colors.text, lineHeight: 24 },
  body: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  bodyMuted: { fontSize: fontSize.body, color: colors.textMuted, lineHeight: 22 },
  label: { fontSize: fontSize.caption, color: colors.textMuted, lineHeight: 16 },
  caption: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 18 },
  link: { fontSize: fontSize.body, color: colors.primary, lineHeight: 22 },
};

const WEIGHT: Record<NonNullable<AppTextProps["weight"]>, "400" | "500" | "600" | "700"> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function Text({
  variant = "body",
  color,
  center,
  weight,
  style,
  ...rest
}: AppTextProps) {
  const v = VARIANT[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: v.fontFamily,
          fontSize: v.fontSize,
          lineHeight: v.lineHeight,
          color: color ?? v.color,
        },
        center && { textAlign: "center" },
        weight && !v.fontFamily && { fontWeight: WEIGHT[weight] },
        style,
      ]}
    />
  );
}
