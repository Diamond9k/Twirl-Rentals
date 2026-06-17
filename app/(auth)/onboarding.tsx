import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { updateProfile } from "@/lib/api/profiles";
import { DEFAULT_SCHOOL, SIZES, SORORITIES } from "@/lib/constants";
import { spacing } from "@/lib/theme";
import type { ItemSize } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function OnboardingScreen() {
  const { userId, refreshProfile } = useAuth();
  const [sorority, setSorority] = useState<string | null>(null);
  const [sizes, setSizes] = useState<ItemSize[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSize = (s: ItemSize) =>
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const finish = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await updateProfile(userId, {
        school: DEFAULT_SCHOOL,
        sorority: sorority ?? undefined,
        sizes,
      });
      await refreshProfile();
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Couldn't save", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button title="Get started" onPress={finish} loading={loading} />
          <Button title="Skip for now" variant="ghost" size="sm" onPress={() => router.replace("/(tabs)")} />
        </View>
      }
    >
      <Text variant="display" style={{ marginTop: spacing.xl }}>
        Tell us about you
      </Text>
      <Text variant="bodyMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.xxl }}>
        This helps sisters find your closet.
      </Text>

      <View style={{ gap: spacing.xl }}>
        <Select
          label="Sorority / chapter"
          placeholder="Choose your chapter"
          sheetTitle="Choose your chapter"
          value={sorority}
          onChange={setSorority}
          options={SORORITIES.map((s) => ({ value: s, label: s }))}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            Your sizes
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {SIZES.map((s) => (
              <Chip key={s} label={s} shape="square" selected={sizes.includes(s)} onPress={() => toggleSize(s)} />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
