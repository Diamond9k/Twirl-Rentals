import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { colors, shadow } from "@/lib/theme";

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  /** White circular surface (the heart/share buttons over photos). */
  circle?: boolean;
  diameter?: number;
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color = colors.text,
  circle,
  diameter = 38,
}: IconButtonProps) {
  if (circle) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={[
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          },
          shadow.card,
        ]}
      >
        <Ionicons name={name} size={size} color={color} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
