import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { getRental, recordContractAgreement, type RentalWithRelations } from "@/lib/api/rentals";
import { RENTAL_AGREEMENT, TERMS_UPDATED } from "@/lib/legal";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function AgreementScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const { userId } = useAuth();
  const [rental, setRental] = useState<RentalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreeing, setAgreeing] = useState(false);

  useEffect(() => {
    getRental(rentalId)
      .then(setRental)
      .catch(() => setRental(null))
      .finally(() => setLoading(false));
  }, [rentalId]);

  const agree = async () => {
    if (!rental || !userId) return;
    setAgreeing(true);
    try {
      await recordContractAgreement({
        rental_id: rental.id,
        renter_id: userId,
        owner_id: rental.owner_id,
      });
      router.replace(`/checkout/${rental.id}`);
    } catch (e) {
      Alert.alert("Couldn't continue", (e as Error).message);
    } finally {
      setAgreeing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Rental Agreement" back />
      <Text variant="caption" center style={{ marginTop: -8, marginBottom: spacing.md }}>
        {TERMS_UPDATED}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
          {RENTAL_AGREEMENT.map((s) => (
            <View key={s.heading} style={{ gap: spacing.sm }}>
              <Text variant="subtitle" weight="semibold">{s.heading}</Text>
              <Text variant="body" color={colors.textMuted}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title="Agree & continue" onPress={agree} loading={agreeing} disabled={!rental} />
      </SafeAreaView>
    </SafeAreaView>
  );
}
