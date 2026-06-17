import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { colors } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface StarsProps {
  rating: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}

export function Stars({ rating, count, size = 14, showValue }: StarsProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ flexDirection: "row", gap: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = rating >= i + 1;
          const half = !filled && rating > i + 0.25 && rating < i + 1;
          return (
            <Ionicons
              key={i}
              name={half ? "star-half" : filled ? "star" : "star-outline"}
              size={size}
              color={colors.star}
            />
          );
        })}
      </View>
      {showValue || count != null ? (
        <Text variant="caption">
          {showValue ? rating.toFixed(1) : ""}
          {count != null ? ` (${count})` : ""}
        </Text>
      ) : null}
    </View>
  );
}
