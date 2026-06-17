import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Sheet";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { createReview } from "@/lib/api/profiles";
import { completeRental } from "@/lib/api/payments";
import {
  approveRental,
  cancelRental,
  declineRental,
  activateRental,
  getRental,
  markRentalReturned,
  type RentalWithRelations,
} from "@/lib/api/rentals";
import { currency, dateRange } from "@/lib/format";
import {
  availableActions,
  statusLabel,
  whatsNext,
  type ActionKind,
  type Role,
} from "@/lib/rentalFlow";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [rental, setRental] = useState<RentalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [stars, setStars] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const load = useCallback(() => {
    getRental(id)
      .then(setRental)
      .catch(() => setRental(null))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(useCallback(() => load(), [load]));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Rental" back />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (!rental) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Rental" back />
        <Text variant="bodyMuted" center style={{ marginTop: 60 }}>
          Rental not found.
        </Text>
      </SafeAreaView>
    );
  }

  const role: Role = rental.owner_id === userId ? "owner" : "renter";
  const party = role === "renter" ? rental.owner : rental.renter;
  const steps = whatsNext(rental.status, role);
  const actions = availableActions(rental.status, role);

  const run = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) Alert.alert(successMsg);
      load();
    } catch (e) {
      Alert.alert("Something went wrong", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handle = (kind: ActionKind) => {
    switch (kind) {
      case "pay":
        router.push(`/checkout/${rental.id}`);
        break;
      case "cancel":
        Alert.alert("Cancel rental?", "This can't be undone.", [
          { text: "Keep", style: "cancel" },
          { text: "Cancel rental", style: "destructive", onPress: () => run(() => cancelRental(rental.id)) },
        ]);
        break;
      case "approve":
        run(() => approveRental(rental.id), "Request approved");
        break;
      case "decline":
        run(() => declineRental(rental.id));
        break;
      case "activate":
        run(() => activateRental(rental.id), "Marked as picked up");
        break;
      case "markReturned":
        setShowReturn(true);
        break;
      case "confirmReturn":
        run(() => completeRental(rental.id), "Return confirmed & deposit released");
        break;
      case "review":
        setShowReview(true);
        break;
    }
  };

  const actionLabel: Record<ActionKind, string> = {
    pay: "Pay to confirm",
    cancel: "Cancel rental",
    approve: "Approve request",
    decline: "Decline",
    activate: "Mark picked up",
    markReturned: "Mark as returned",
    confirmReturn: "Confirm return & release deposit",
    review: "Leave a review",
  };

  const cover = rental.item?.images?.[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Rental" back />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item summary */}
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <Image
            source={{ uri: cover }}
            style={{ width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="title">{rental.item?.title}</Text>
            <Text variant="caption">
              {role === "renter" ? "Listed by " : "Rented by "}
              {party?.full_name ?? "—"}
            </Text>
            <Text variant="caption">{dateRange(rental.start_date, rental.end_date)}</Text>
            <Badge label={statusLabel(rental.status)} tone={statusTone(rental.status)} />
          </View>
        </View>

        {/* Pricing */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 8 }}>
          <Row label="Rental subtotal" value={currency(rental.subtotal)} />
          <Row label="Service fee" value={currency(rental.commission_amount)} />
          <Row label="Total" value={currency(rental.total_price)} bold />
          {rental.deposit_amount > 0 ? (
            <Row label="Refundable deposit" value={currency(rental.deposit_amount)} muted />
          ) : null}
        </View>

        {/* What's next */}
        {steps.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
              What&apos;s next
            </Text>
            {steps.map((s, i) => (
              <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
                <Ionicons name="ellipse" size={7} color={colors.primary} style={{ marginTop: 7 }} />
                <Text variant="body" style={{ flex: 1 }}>
                  {s.text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          {actions.map((a, i) => (
            <Button
              key={a}
              title={actionLabel[a]}
              variant={a === "decline" || a === "cancel" ? "ghost" : i === 0 ? "primary" : "secondary"}
              loading={busy}
              onPress={() => handle(a)}
            />
          ))}
          {rental.conversation_id ? (
            <Button
              title={`Message ${party?.full_name?.split(" ")[0] ?? ""}`.trim()}
              variant="secondary"
              onPress={() => router.push(`/conversation/${rental.conversation_id}`)}
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Mark returned confirm */}
      <Dialog visible={showReturn} onClose={() => setShowReturn(false)}>
        <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
          <Ionicons name="checkmark" size={28} color={colors.primary} />
        </View>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>
          Mark as returned?
        </Text>
        <Text variant="bodyMuted" center style={{ marginBottom: spacing.xl }}>
          Your {currency(rental.deposit_amount)} deposit is released once {party?.full_name?.split(" ")[0] ?? "the owner"} confirms they received the piece.
        </Text>
        <View style={{ width: "100%", gap: spacing.md }}>
          <Button
            title="Mark as returned"
            loading={busy}
            onPress={() => {
              setShowReturn(false);
              run(() => markRentalReturned(rental.id));
            }}
          />
          <Button title="Cancel" variant="ghost" onPress={() => setShowReturn(false)} />
        </View>
      </Dialog>

      {/* Review */}
      <Dialog visible={showReview} onClose={() => setShowReview(false)}>
        <Text variant="title" center style={{ marginBottom: spacing.md }}>
          Leave a review
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
              <Ionicons
                name={n <= stars ? "star" : "star-outline"}
                size={32}
                color={colors.star}
              />
            </Pressable>
          ))}
        </View>
        <TextField
          placeholder="Share how it went…"
          value={reviewBody}
          onChangeText={setReviewBody}
          multiline
          containerStyle={{ width: "100%", marginBottom: spacing.lg }}
        />
        <View style={{ width: "100%", gap: spacing.md }}>
          <Button
            title="Submit review"
            loading={busy}
            onPress={() => {
              if (!userId || !party) return;
              setShowReview(false);
              run(
                () =>
                  createReview({
                    rental_id: rental.id,
                    reviewer_id: userId,
                    reviewee_id: party.id,
                    stars,
                    body: reviewBody.trim() || undefined,
                  }),
                "Thanks for your review!",
              );
            }}
          />
          <Button title="Not now" variant="ghost" onPress={() => setShowReview(false)} />
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant={muted ? "caption" : "body"} color={muted ? colors.textMuted : undefined}>
        {label}
      </Text>
      <Text variant="body" weight={bold ? "bold" : "regular"} color={bold ? colors.primary : undefined}>
        {value}
      </Text>
    </View>
  );
}
