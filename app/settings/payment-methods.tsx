import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Payment" back />
      <View style={{ paddingHorizontal: SCREEN_PADDING, marginTop: spacing.md, gap: spacing.lg }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="card-outline" size={26} color={colors.primary} />
          </View>
          <Text variant="title" center>No saved cards yet</Text>
          <Text variant="bodyMuted" center>
            You&apos;ll add a card securely when you check out. Your full card number is never stored on Twirl.
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
          <Text variant="caption">Payments are securely processed by Stripe.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
