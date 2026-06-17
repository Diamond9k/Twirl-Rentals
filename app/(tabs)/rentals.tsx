import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RentalCard } from "@/components/RentalCard";
import { Wordmark } from "@/components/Wordmark";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/components/ui/Text";
import { getMyRentals, type RentalWithRelations } from "@/lib/api/rentals";
import { isActive } from "@/lib/rentalFlow";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function RentalsScreen() {
  const { userId } = useAuth();
  const [rentals, setRentals] = useState<RentalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"renter" | "owner">("renter");

  useFocusEffect(
    useCallback(() => {
      getMyRentals()
        .then(setRentals)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const mine = useMemo(
    () => rentals.filter((r) => (mode === "renter" ? r.renter_id === userId : r.owner_id === userId)),
    [rentals, mode, userId],
  );
  const active = mine.filter((r) => isActive(r.status));
  const past = mine.filter((r) => !isActive(r.status));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: spacing.sm }}>
          <Wordmark />
          <Text variant="display" style={{ marginTop: spacing.xs }}>
            Rentals
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.xl }}>
          {(["renter", "owner"] as const).map((m) => {
            const activeTab = mode === m;
            return (
              <Pressable key={m} onPress={() => setMode(m)}>
                <Text
                  variant="subtitle"
                  weight={activeTab ? "semibold" : "regular"}
                  color={activeTab ? colors.primary : colors.textMuted}
                >
                  {m === "renter" ? "Renting" : "Lending"}
                </Text>
                {activeTab ? (
                  <View style={{ height: 2, backgroundColor: colors.primary, marginTop: 6, borderRadius: 1 }} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : mine.length === 0 ? (
          <EmptyState
            icon="bag-handle-outline"
            title={mode === "renter" ? "No rentals yet" : "No lending yet"}
            message={
              mode === "renter"
                ? "Browse the closet and request your first piece."
                : "List a piece to start earning from your closet."
            }
            actionLabel={mode === "renter" ? "Browse" : "List a piece"}
            onAction={() => router.push(mode === "renter" ? "/(tabs)" : "/(tabs)/list")}
          />
        ) : (
          <View style={{ gap: spacing.lg }}>
            {active.length > 0 ? (
              <>
                <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                  Active &amp; upcoming
                </Text>
                {active.map((r) => (
                  <RentalCard
                    key={r.id}
                    rental={r}
                    role={mode}
                    highlight={r.status === "active"}
                    onPress={() => router.push(`/rental/${r.id}`)}
                  />
                ))}
              </>
            ) : null}

            {past.length > 0 ? (
              <>
                <Text
                  variant="label"
                  style={{ textTransform: "uppercase", letterSpacing: 1, marginTop: spacing.sm }}
                >
                  Past
                </Text>
                {past.map((r) => (
                  <RentalCard key={r.id} rental={r} role={mode} onPress={() => router.push(`/rental/${r.id}`)} />
                ))}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
