import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { getEarnings, requestPayout } from "@/lib/api/payments";
import { currency, longDate } from "@/lib/format";
import { colors, fonts, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { EarningsResponse } from "@/lib/types";

export default function EarningsScreen() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getEarnings()
      .then(setData)
      .catch((e) => Alert.alert("Couldn't load earnings", (e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const cashOut = async () => {
    setCashingOut(true);
    try {
      const res = await requestPayout();
      Alert.alert("Cash out started", `${currency(res.amount)} is on its way to your bank.`);
      load();
    } catch (e) {
      Alert.alert("Couldn't cash out", (e as Error).message);
    } finally {
      setCashingOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Earnings" back />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const balance = data?.available_balance ?? 0;
  const notSetUp = !data?.payouts_enabled;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Earnings" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.xxl, gap: spacing.lg }}>
          <View>
            <Text variant="caption">Available to cash out</Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 48, color: colors.wine }}>
              {currency(balance)}
            </Text>
            {data?.stripe_pending_balance ? (
              <Text variant="caption">{currency(data.stripe_pending_balance)} pending</Text>
            ) : null}
          </View>
          {notSetUp ? (
            <Button title="Set up payouts" onPress={() => router.push("/settings/payout")} />
          ) : (
            <Button title="Cash out to bank" onPress={cashOut} loading={cashingOut} disabled={balance <= 0} />
          )}
        </View>

        {/* Bank */}
        <Pressable
          onPress={() => router.push("/settings/payout")}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Ionicons name="business-outline" size={20} color={colors.text} />
            <Text variant="body">
              {data?.bank_last4 ? `Connected to •••• ${data.bank_last4} (Stripe)` : "Connect your bank"}
            </Text>
          </View>
          <Text variant="link" weight="semibold">{data?.bank_last4 ? "Change" : "Set up"}</Text>
        </Pressable>

        {/* History */}
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            Payout history
          </Text>
          {!data?.history.length ? (
            <Text variant="bodyMuted" style={{ paddingVertical: spacing.lg }}>
              Your earnings and cash-outs will show up here.
            </Text>
          ) : (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
              {data.history.map((h, i) => {
                const isPayout = h.type === "manual_payout";
                return (
                  <View
                    key={h.id}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="body">{h.description ?? (isPayout ? "Cash out" : "Rental earnings")}</Text>
                      <Text variant="caption">{longDate(h.created_at)}</Text>
                    </View>
                    <Text variant="body" weight="semibold" color={isPayout ? colors.textMuted : colors.success}>
                      {isPayout ? "-" : "+"}
                      {currency(h.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
