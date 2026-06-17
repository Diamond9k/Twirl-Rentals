import { View } from "react-native";

import { colors, fonts, fontSize } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

/** The lowercase serif "twirl" wordmark used on tab screen headers. */
export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: fonts.serifBold,
          fontSize: fontSize.display,
          color: colors.wine,
        }}
      >
        twirl
      </Text>
      {subtitle ? (
        <Text variant="caption" style={{ marginTop: -2 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
