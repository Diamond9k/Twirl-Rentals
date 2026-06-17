import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemCard } from "@/components/ItemCard";
import { Wordmark } from "@/components/Wordmark";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { Text } from "@/components/ui/Text";
import { getItemsByOwner } from "@/lib/api/items";
import { getLedgerAvailableCents } from "@/lib/api/payments";
import { fromCents } from "@/lib/format";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { Item } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text variant="display" color={colors.wine} style={{ fontSize: 26 }}>
        {value}
      </Text>
      <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

export default function YouScreen() {
  const { profile, userId } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [cashOutCents, setCashOutCents] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getItemsByOwner(userId).then(setItems).catch(() => {});
      getLedgerAvailableCents(userId).then(setCashOutCents).catch(() => {});
    }, [userId]),
  );

  const preview = items.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
          <Wordmark />
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.lg, gap: spacing.sm }}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={96} />
          <Text variant="display">{profile?.full_name ?? "Your name"}</Text>
          <Text variant="bodyMuted">
            {[profile?.sorority, profile?.school].filter(Boolean).join(" · ") || "Add your chapter"}
          </Text>
          {profile && profile.rating > 0 ? (
            <Stars rating={profile.rating} size={16} showValue />
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: spacing.xl,
            paddingVertical: spacing.lg,
          }}
        >
          <Stat value={items.length} label="Listings" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <Stat value={profile?.total_rentals ?? 0} label="Rentals" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <Stat value={(profile?.rating ?? 0).toFixed(1)} label="Rating" />
        </View>

        {cashOutCents > 0 ? (
          <Pressable
            onPress={() => router.push("/settings/earnings")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.primarySoft,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <View>
              <Text variant="caption">Available to cash out</Text>
              <Text variant="hero" style={{ fontSize: 28 }}>
                {fromCents(cashOutCents)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings/earnings")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
              }}
            >
              <Text weight="semibold" color={colors.white}>
                Cash out
              </Text>
            </Pressable>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
          <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            My closet
          </Text>
          <Pressable onPress={() => router.push("/closet")} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text variant="link" weight="semibold">View all</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {preview.map((item) => (
            <View key={item.id} style={{ width: "47.5%" }}>
              <ItemCard
                item={item}
                footer="status"
                onPress={() => router.push(`/listing/${item.id}`)}
                onEdit={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}

          <Pressable
            onPress={() => router.push("/(tabs)/list")}
            style={{
              width: "47.5%",
              aspectRatio: 0.7,
              borderRadius: radius.lg,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: colors.borderStrong,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={26} color={colors.primary} />
            </View>
            <Text weight="semibold" color={colors.primary}>Add a piece</Text>
            <Text variant="caption">List more, earn more</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
