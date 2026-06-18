import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { createConnectAccount } from "@/lib/api/payments";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

const PERKS = [
  { icon: "lock-closed-outline", text: "Bank details are handled securely by Stripe — Twirl never sees them." },
  { icon: "cash-outline", text: "Cash out your earnings to your bank whenever you want." },
  { icon: "shield-checkmark-outline", text: "Deposits are held safely and released after each rental." },
] as const;

export default function PayoutScreen() {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const setup = async () => {
    setLoading(true);
    try {
      const { url } = await createConnectAccount();
      await WebBrowser.openBrowserAsync(url);
      await refreshProfile();
    } catch (e) {
      Alert.alert("Couldn't start setup", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Payouts" back />
      <View style={{ flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.lg }}>
        <Text variant="display">Get paid for your closet</Text>
        <Text variant="bodyMuted" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
          Connect a bank account through Stripe to receive your rental earnings.
        </Text>

        <View style={{ gap: spacing.lg }}>
          {PERKS.map((p) => (
            <View key={p.text} style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={p.icon} size={20} color={colors.primary} />
              </View>
              <Text variant="body" style={{ flex: 1, marginTop: 8 }}>{p.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: SCREEN_PADDING }}>
        <Button title="Set up payouts with Stripe" onPress={setup} loading={loading} />
        <View style={{ height: spacing.md }} />
      </SafeAreaView>
    </SafeAreaView>
  );
}
