import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemCard } from "@/components/ItemCard";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { getItemsByOwner } from "@/lib/api/items";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { Item, ItemStatus } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

const TABS: { key: ItemStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "rented", label: "Rented" },
  { key: "draft", label: "Drafts" },
];

export default function ClosetScreen() {
  const { userId } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<ItemStatus>("active");

  useFocusEffect(
    useCallback(() => {
      if (userId) getItemsByOwner(userId).then(setItems).catch(() => {});
    }, [userId]),
  );

  const filtered = useMemo(() => items.filter((i) => i.status === tab), [items, tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="My closet" back />

      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: SCREEN_PADDING,
          marginBottom: spacing.lg,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text weight="semibold" color={active ? colors.white : colors.text}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {filtered.map((item) => (
            <View key={item.id} style={{ width: "47.5%" }}>
              <ItemCard
                item={item}
                footer="status"
                onPress={() => router.push(`/listing/${item.id}`)}
                onEdit={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}

          {tab === "active" || filtered.length === 0 ? (
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
              <Ionicons name="add" size={28} color={colors.primary} />
              <Text weight="semibold" color={colors.primary}>
                Add a piece
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
