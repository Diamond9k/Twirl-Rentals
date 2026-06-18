import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { RENTAL_TERMS, TERMS_UPDATED } from "@/lib/legal";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";

export default function LegalScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Rental Terms" back />
      <Text variant="caption" center style={{ marginTop: -8, marginBottom: spacing.md }}>
        {TERMS_UPDATED}
      </Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        {RENTAL_TERMS.map((s) => (
          <View key={s.heading} style={{ gap: spacing.sm }}>
            <Text variant="subtitle" weight="semibold">{s.heading}</Text>
            <Text variant="body" color={colors.textMuted}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
