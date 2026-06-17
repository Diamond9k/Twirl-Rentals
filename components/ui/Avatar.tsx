import { Image } from "expo-image";
import { View } from "react-native";

import { colors } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.surfaceAlt }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        weight="semibold"
        color={colors.primary}
        style={{ fontSize: size * 0.38, textTransform: "uppercase" }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
