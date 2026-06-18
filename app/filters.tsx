import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { OCCASIONS, SIZES, SORORITIES } from "@/lib/constants";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";

const MAX_PRICE = 100;

export default function FiltersScreen() {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sorority, setSorority] = useState<string | null>(null);

  const reset = () => {
    setOccasion(null);
    setSize(null);
    setMaxPrice(MAX_PRICE);
    setSorority(null);
  };

  const apply = () => {
    const params: Record<string, string> = {};
    if (occasion) params.occasion = occasion;
    if (size) params.size = size;
    if (maxPrice < MAX_PRICE) params.maxPrice = String(maxPrice);
    if (sorority) params.sorority = sorority;
    router.replace({ pathname: "/search", params });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SCREEN_PADDING,
          paddingVertical: spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="bodyMuted">Close</Text>
        </Pressable>
        <Text variant="title">Filters</Text>
        <Pressable onPress={reset} hitSlop={8}>
          <Text variant="link" weight="semibold">
            Reset
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Occasion">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {OCCASIONS.map((o) => (
              <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(occasion === o ? null : o)} />
            ))}
          </View>
        </Section>

        <Section title="Size">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {SIZES.map((s) => (
              <Chip key={s} label={s} shape="square" selected={size === s} onPress={() => setSize(size === s ? null : s)} />
            ))}
          </View>
        </Section>

        <Section title="Max price">
          <Slider
            minimumValue={5}
            maximumValue={MAX_PRICE}
            step={5}
            value={maxPrice}
            onValueChange={setMaxPrice}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderStrong}
            thumbTintColor={colors.primary}
          />
          <Text variant="caption" center>
            {maxPrice >= MAX_PRICE ? "Any price" : `Up to $${maxPrice} / day`}
          </Text>
        </Section>

        <Select
          label="Chapter"
          placeholder="All chapters"
          sheetTitle="Choose a chapter"
          value={sorority}
          onChange={setSorority}
          options={SORORITIES.map((s) => ({ value: s, label: s }))}
        />
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.sm }}>
        <Button title="Show results" onPress={apply} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
