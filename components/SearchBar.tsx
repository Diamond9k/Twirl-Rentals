import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

import { colors, radius, spacing, fontSize } from "@/lib/theme";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  /** When provided, the whole bar is a button (browse → search screen). */
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search the closet",
  onSubmitEditing,
  autoFocus,
  editable = true,
  onPress,
}: SearchBarProps) {
  const inner = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        height: 50,
      }}
    >
      <Ionicons name="search" size={20} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        editable={editable && !onPress}
        pointerEvents={onPress ? "none" : "auto"}
        returnKeyType="search"
        style={{ flex: 1, fontSize: fontSize.base, color: colors.text }}
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }
  return inner;
}
