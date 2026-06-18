import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How rentals work",
    a: "Browse the closet, pick your dates, and send a request to the lender. Once you pay, arrange pickup through messages, then mark the piece returned when you're done.",
  },
  {
    q: "Deposits & refunds",
    a: "Some pieces require a refundable deposit, held when you book. It's released back to you once the lender confirms the item was returned in good condition.",
  },
  {
    q: "Returns & late fees",
    a: "Return the piece by your end date. Late returns may incur a daily fee, and damage may be deducted from your deposit.",
  },
  {
    q: "Payouts",
    a: "Lenders connect a bank through Stripe and cash out earnings anytime from the Earnings screen. Twirl keeps a small service fee on each rental.",
  },
  {
    q: "Safety & meetups",
    a: "Meet in public, well-lit campus spots for pickups and returns. Keep all communication and payments inside Twirl, and report anything that feels off.",
  },
];

export default function HelpScreen() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Help" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
          {FAQS.map((f, i) => {
            const expanded = open === i;
            return (
              <View key={f.q} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => setOpen(expanded ? null : i)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg }}
                >
                  <Text variant="body" style={{ flex: 1 }}>{f.q}</Text>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
                </Pressable>
                {expanded ? (
                  <Text variant="bodyMuted" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
                    {f.a}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Contact support"
            variant="secondary"
            onPress={() => Linking.openURL("mailto:support@twirl.rentals?subject=Twirl%20Support")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
