import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListingForm } from "@/components/ListingForm";
import { Wordmark } from "@/components/Wordmark";
import { Text } from "@/components/ui/Text";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";

export default function ListScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: spacing.xxxl * 2,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <Wordmark />
          <Text variant="display" style={{ marginTop: spacing.xs }}>
            List a piece
          </Text>
          <Text variant="bodyMuted" style={{ marginTop: spacing.xs }}>
            Earn from what&apos;s already in your closet.
          </Text>
        </View>
        <ListingForm />
      </ScrollView>
    </SafeAreaView>
  );
}
