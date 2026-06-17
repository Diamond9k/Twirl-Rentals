import { Pressable } from "react-native";

import { colors, radius, spacing, fontSize } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** "square" matches the size selectors in the mocks; default is a pill. */
  shape?: "pill" | "square";
}

export function Chip({ label, selected, onPress, shape = "pill" }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: shape === "square" ? 0 : spacing.lg,
        width: shape === "square" ? 48 : undefined,
        height: shape === "square" ? 48 : 38,
        minWidth: shape === "square" ? 48 : undefined,
        borderRadius: shape === "square" ? radius.md : radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.borderStrong,
      }}
    >
      <Text
        weight={selected ? "semibold" : "medium"}
        color={selected ? colors.white : colors.text}
        style={{ fontSize: fontSize.body }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
