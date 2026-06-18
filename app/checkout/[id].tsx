import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  StripeProvider,
  useStripe,
} from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { createPaymentIntent } from "@/lib/api/payments";
import { getRental, type RentalWithRelations } from "@/lib/api/rentals";
import { currency, dateRange } from "@/lib/format";
import { colors, fonts, radius, spacing, SCREEN_PADDING } from "@/lib/theme";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function CheckoutInner({ rental }: { rental: RentalWithRelations }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);

  const dueToday = rental.total_price + rental.deposit_amount;

  const confirmSheet = async (clientSecret: string, label: string) => {
    const init = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: "Twirl",
      allowsDelayedPaymentMethods: false,
    });
    if (init.error) throw new Error(init.error.message);
    const res = await presentPaymentSheet();
    if (res.error && res.error.code !== "Canceled") {
      throw new Error(`${label}: ${res.error.message}`);
    }
    return !res.error;
  };

  const pay = async () => {
    setPaying(true);
    try {
      const { paymentIntentClientSecret, depositIntentClientSecret } =
        await createPaymentIntent(rental.id);

      if (paymentIntentClientSecret) {
        const ok = await confirmSheet(paymentIntentClientSecret, "Rental");
        if (!ok) return; // user canceled
      }
      if (depositIntentClientSecret) {
        await confirmSheet(depositIntentClientSecret, "Deposit");
      }

      router.replace({
        pathname: "/booking-success",
        params: { rentalId: rental.id, title: rental.item?.title ?? "your rental", range: dateRange(rental.start_date, rental.end_date) },
      });
    } catch (e) {
      Alert.alert("Payment failed", (e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Item */}
        <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
          <Image source={{ uri: rental.item?.images?.[0] }} style={{ width: 64, height: 80, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: 18 }}>{rental.item?.title}</Text>
            <Text variant="caption">Listed by {rental.owner?.full_name?.split(" ")[0] ?? "owner"}</Text>
            <Text variant="caption">{dateRange(rental.start_date, rental.end_date)}</Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 10 }}>
          <Row label="Rental subtotal" value={currency(rental.subtotal)} />
          <Row label="Service fee" value={currency(rental.commission_amount)} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="title">Rental total</Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.primary }}>
              {currency(rental.total_price)}
            </Text>
          </View>
          {rental.deposit_amount > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="body">Refundable deposit</Text>
                <Text variant="caption">Held when you book and returned after the rental.</Text>
              </View>
              <Text variant="body" weight="medium">{currency(rental.deposit_amount)}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text variant="body" weight="medium">Total charged today</Text>
            <Text variant="body" weight="semibold">{currency(dueToday)}</Text>
          </View>
        </View>

        {/* Agreement checkbox */}
        <Pressable onPress={() => setAgreed((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: agreed ? colors.primary : colors.borderStrong,
              backgroundColor: agreed ? colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {agreed ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
          </View>
          <Text variant="body" style={{ flex: 1 }}>
            I&apos;ve read and agree to the{" "}
            <Text variant="link" onPress={() => router.push(`/agreement/${rental.id}`)}>
              rental agreement
            </Text>
            .
          </Text>
        </Pressable>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={
            rental.deposit_amount > 0
              ? `Pay ${currency(rental.total_price)} + ${currency(rental.deposit_amount)} deposit`
              : `Pay ${currency(rental.total_price)}`
          }
          onPress={pay}
          loading={paying}
          disabled={!agreed}
        />
      </SafeAreaView>
    </>
  );
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rental, setRental] = useState<RentalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRental(id)
      .then(setRental)
      .catch(() => setRental(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Confirm & pay" back />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : !rental ? (
        <Text variant="bodyMuted" center style={{ marginTop: 60 }}>
          Rental not found.
        </Text>
      ) : (
        <StripeProvider publishableKey={PUBLISHABLE_KEY} merchantIdentifier="merchant.rentals.twirl.app">
          <CheckoutInner rental={rental} />
        </StripeProvider>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="body">{label}</Text>
      <Text variant="body" weight="medium">{value}</Text>
    </View>
  );
}
