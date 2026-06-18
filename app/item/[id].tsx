import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DateRangeSheet } from "@/components/DateRangeSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { Text } from "@/components/ui/Text";
import { getBookedRanges, getItem } from "@/lib/api/items";
import { createRentalRequest } from "@/lib/api/rentals";
import { getSavedItemIds, setSaved } from "@/lib/api/social";
import { COMMISSION_RATE, CONDITION_LABELS } from "@/lib/constants";
import { currency, dateRange, rentalDays } from "@/lib/format";
import { colors, fonts, radius, spacing, SCREEN_PADDING, shadow } from "@/lib/theme";
import type { ItemWithOwner } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

const { width } = Dimensions.get("window");

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [item, setItem] = useState<ItemWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSavedState] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDates, setShowDates] = useState(false);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [booked, setBooked] = useState<{ start_date: string; end_date: string }[]>([]);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([getItem(id), getBookedRanges(id)])
      .then(([it, b]) => {
        setItem(it);
        setBooked(b);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
    if (userId) getSavedItemIds(userId).then((s) => setSavedState(s.has(id))).catch(() => {});
  }, [id, userId]);

  const pricing = useMemo(() => {
    if (!item || !range) return null;
    const days = rentalDays(range.start, range.end);
    const subtotal = item.price_per_day * days;
    const fee = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
    const total = subtotal + fee;
    const dueNow = total + (item.deposit ?? 0);
    return { days, subtotal, fee, total, deposit: item.deposit ?? 0, dueNow };
  }, [item, range]);

  const toggleSave = async () => {
    if (!userId) return;
    setSavedState(!saved);
    try {
      await setSaved(userId, id, !saved);
    } catch {
      setSavedState(saved);
    }
  };

  const request = async () => {
    if (!range) {
      setShowDates(true);
      return;
    }
    setRequesting(true);
    try {
      const rentalId = await createRentalRequest(id, range.start, range.end);
      router.push(`/agreement/${rentalId}`);
    } catch (e) {
      Alert.alert("Couldn't request", (e as Error).message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text variant="bodyMuted" center style={{ marginTop: 80 }}>
          This piece is no longer available.
        </Text>
      </SafeAreaView>
    );
  }

  const meta = [item.brand, item.size ? `Size ${item.size}` : null, item.condition ? CONDITION_LABELS[item.condition] : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Carousel */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {(item.images.length ? item.images : [""]).map((uri, i) => (
              <Image
                key={i}
                source={uri ? { uri } : undefined}
                style={{ width, height: width * 1.2, backgroundColor: colors.surfaceAlt }}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.sm }}>
              <CircleBtn name="chevron-back" onPress={() => router.back()} />
              <CircleBtn name={saved ? "heart" : "heart-outline"} color={saved ? colors.primary : colors.text} onPress={toggleSave} />
            </View>
          </SafeAreaView>

          {item.images.length > 1 ? (
            <View style={{ flexDirection: "row", gap: 6, alignSelf: "center", position: "absolute", bottom: 28 }}>
              {item.images.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === photoIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === photoIndex ? colors.white : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Detail sheet */}
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -24,
            paddingHorizontal: SCREEN_PADDING,
            paddingTop: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <View>
            <Text variant="hero" style={{ fontSize: 30 }}>
              {item.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.primary }}>
                {currency(item.price_per_day)}
              </Text>
              <Text variant="bodyMuted">/ day</Text>
            </View>
            {meta ? (
              <Text variant="bodyMuted" style={{ marginTop: 6 }}>
                {meta}
              </Text>
            ) : null}
          </View>

          {/* Owner */}
          {item.owner ? (
            <Pressable
              onPress={() => router.push(`/user/${item.owner!.id}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            >
              <Avatar uri={item.owner.avatar_url} name={item.owner.full_name} size={40} />
              <Text variant="body" style={{ flex: 1 }}>
                Listed by{" "}
                <Text weight="semibold">{item.owner.full_name?.split(" ")[0]}</Text>
                {item.owner.sorority ? ` · ${item.owner.sorority}` : ""}
              </Text>
              {item.owner.rating > 0 ? <Stars rating={item.owner.rating} size={14} showValue /> : null}
            </Pressable>
          ) : null}

          {/* Dates */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
              Select your dates
            </Text>
            <Pressable
              onPress={() => setShowDates(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                height: 52,
                backgroundColor: colors.surface,
              }}
            >
              <Text color={range ? colors.text : colors.textFaint}>
                {range ? dateRange(range.start, range.end) : "Add your rental dates"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Pricing preview */}
          {pricing ? (
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, gap: 8 }}>
              <Row label={`${currency(item.price_per_day)} × ${pricing.days} days`} value={currency(pricing.subtotal)} />
              <Row label="Service fee" value={currency(pricing.fee)} />
              {pricing.deposit > 0 ? <Row label="Deposit (refundable)" value={currency(pricing.deposit)} /> : null}
              <View style={{ height: 1, backgroundColor: colors.borderStrong, marginVertical: 4 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text variant="title">Due now</Text>
                <Text style={{ fontFamily: fonts.serifBold, fontSize: 24, color: colors.text }}>
                  {currency(pricing.dueNow)}
                </Text>
              </View>
              {pricing.deposit > 0 ? (
                <Text variant="caption">
                  Includes {currency(pricing.deposit)} refundable deposit, returned after the rental.
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Description */}
          {item.description ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                The details
              </Text>
              <Text variant="body">{item.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button title={range ? "Request to rent" : "Choose dates"} onPress={request} loading={requesting} />
          </View>
          {item.owner ? (
            <Button
              title=""
              variant="secondary"
              fullWidth={false}
              leftIcon={<Ionicons name="chatbubble-outline" size={20} color={colors.primary} />}
              onPress={() => router.push(`/user/${item.owner!.id}`)}
              style={{ width: 56, paddingHorizontal: 0 }}
            />
          ) : null}
        </View>
      </SafeAreaView>

      <DateRangeSheet
        visible={showDates}
        onClose={() => setShowDates(false)}
        blocked={booked}
        onConfirm={(start, end) => {
          setRange({ start, end });
          setShowDates(false);
        }}
      />
    </View>
  );
}

function CircleBtn({ name, onPress, color = colors.text }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
        shadow.card,
      ]}
    >
      <Ionicons name={name} size={22} color={color} />
    </Pressable>
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
