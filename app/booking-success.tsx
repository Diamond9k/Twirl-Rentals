import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/lib/theme";

export default function BookingSuccessScreen() {
  const { rentalId, title, range } = useLocalSearchParams<{
    rentalId?: string;
    title?: string;
    range?: string;
  }>();

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="checkmark" size={48} color={colors.white} />
        </View>
        <Text variant="hero" center>
          You&apos;re all set!
        </Text>
        <Text variant="bodyMuted" center style={{ paddingHorizontal: spacing.xl }}>
          Your rental of {title ?? "your piece"}
          {range ? ` is confirmed for ${range}.` : " is confirmed."} The owner will be in touch to
          arrange pickup.
        </Text>
      </View>

      <View style={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <Button
          title="View rental"
          onPress={() => (rentalId ? router.replace(`/rental/${rentalId}`) : router.replace("/(tabs)/rentals"))}
        />
        <Button title="Back to browsing" variant="ghost" onPress={() => router.replace("/(tabs)")} />
      </View>
    </Screen>
  );
}
