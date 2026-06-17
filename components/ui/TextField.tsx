import { forwardRef } from "react";
import {
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing, fontSize } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, containerStyle, multiline, style, ...rest },
  ref,
) {
  return (
    <View style={[{ gap: spacing.sm }, containerStyle]}>
      {label ? (
        <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textFaint}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: multiline ? spacing.md : 14,
            fontSize: fontSize.base,
            color: colors.text,
            backgroundColor: colors.surface,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
        multiline={multiline}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
});
