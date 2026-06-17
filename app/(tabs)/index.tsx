import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { Wordmark } from "@/components/Wordmark";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/components/ui/Text";
import { browseItems } from "@/lib/api/items";
import { getLedgerAvailableCents } from "@/lib/api/payments";
import { getSavedItemIds, setSaved } from "@/lib/api/social";
import { fromCents } from "@/lib/format";
import { colors, radius, spacing, SCREEN_PADDING, shadow } from "@/lib/theme";
import type { ItemWithOwner } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

const CHIPS = ["All", "Formals", "Game Day", "Date Party", "Rush", "Everyday"];

export default function BrowseScreen() {
  const { userId, profile } = useAuth();
  const [items, setItems] = useState<ItemWithOwner[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [occasion, setOccasion] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cashOutCents, setCashOutCents] = useState(0);

  const load = useCallback(async () => {
    try {
      const [feed, saved] = await Promise.all([
        browseItems(occasion === "All" ? {} : { occasion }),
        userId ? getSavedItemIds(userId) : Promise.resolve(new Set<string>()),
      ]);
      setItems(feed);
      setSavedIds(saved);
      if (userId) {
        getLedgerAvailableCents(userId).then(setCashOutCents).catch(() => {});
      }
    } catch (e) {
      console.warn("browse load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [occasion, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async (itemId: string) => {
    if (!userId) return;
    const next = new Set(savedIds);
    const isSaved = next.has(itemId);
    isSaved ? next.delete(itemId) : next.add(itemId);
    setSavedIds(next);
    try {
      await setSaved(userId, itemId, !isSaved);
    } catch {
      load();
    }
  };

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark subtitle={profile?.school ?? "University of Arkansas"} />
        <Pressable onPress={() => router.push("/(tabs)/you")}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={44} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchBar onPress={() => router.push("/search")} />
        </View>
        <Pressable
          onPress={() => router.push("/filters")}
          style={[
            {
              width: 50,
              height: 50,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={CHIPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item: chip }) => {
          const active = occasion === chip;
          return (
            <Pressable
              onPress={() => setOccasion(chip)}
              style={{
                paddingHorizontal: spacing.lg,
                height: 38,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.borderStrong,
              }}
            >
              <Text
                weight={active ? "semibold" : "medium"}
                color={active ? colors.white : colors.text}
              >
                {chip}
              </Text>
            </Pressable>
          );
        }}
      />

      {cashOutCents > 0 ? (
        <Pressable
          onPress={() => router.push("/settings/earnings")}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.primarySoft,
              borderRadius: radius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <Text variant="body">
              You have{" "}
              <Text weight="bold" color={colors.primary}>
                {fromCents(cashOutCents)}
              </Text>{" "}
              ready to cash out
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text variant="link" weight="semibold">
              Cash out
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </Pressable>
      ) : null}

      <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
        New this week
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: spacing.xxxl,
          gap: spacing.md,
        }}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "50%" }}>
            <ItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
          ) : (
            <EmptyState
              icon="shirt-outline"
              title="No listings yet"
              message="Be the first to list a piece from your closet."
              actionLabel="List a piece"
              onAction={() => router.push("/(tabs)/list")}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
