import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/components/ui/Text";
import { browseItems, type BrowseFilters } from "@/lib/api/items";
import { getSavedItemIds, setSaved } from "@/lib/api/social";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { ItemWithOwner } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    occasion?: string;
    category?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    sorority?: string;
  }>();
  const { userId } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemWithOwner[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const filters: BrowseFilters = {
    occasion: params.occasion,
    category: params.category,
    size: params.size,
    sorority: params.sorority,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };
  const hasFilters = Object.values(filters).some((v) => v != null);

  const run = async (text: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const [r, saved] = await Promise.all([
        browseItems({ ...filters, search: text || undefined }),
        userId ? getSavedItemIds(userId) : Promise.resolve(new Set<string>()),
      ]);
      setResults(r);
      setSavedIds(saved);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when arriving with filters applied.
  useEffect(() => {
    if (hasFilters) run("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = async (itemId: string) => {
    if (!userId) return;
    const next = new Set(savedIds);
    const isSaved = next.has(itemId);
    isSaved ? next.delete(itemId) : next.add(itemId);
    setSavedIds(next);
    try {
      await setSaved(userId, itemId, !isSaved);
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search dresses, tops, and more"
            onSubmitEditing={() => run(query)}
          />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="link" weight="semibold">
            Cancel
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, gap: spacing.md, paddingBottom: spacing.xxxl }}
          ListHeaderComponent={
            searched && results.length > 0 ? (
              <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm }}>
                Results
              </Text>
            ) : null
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
            searched ? (
              <EmptyState icon="search-outline" title="No matches" message="Try different dates, sizes, or a broader search." />
            ) : (
              <EmptyState icon="search-outline" title="Search the closet" message="Find pieces by name, brand, or occasion." />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
