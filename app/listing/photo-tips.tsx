import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";

const TIPS: { icon: keyof typeof Ionicons.glyphMap; title: string; hint: string }[] = [
  { icon: "sunny-outline", title: "Natural light, no flash", hint: "Shoot near a window in daylight for true colors." },
  { icon: "body-outline", title: "Show the full piece", hint: "Capture the whole item head to hem." },
  { icon: "square-outline", title: "Clean, simple background", hint: "A plain wall keeps the focus on the piece." },
  { icon: "search-outline", title: "Add a close-up detail shot", hint: "Show fabric, straps, and any special details." },
];

export default function PhotoTipsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Great photos rent faster" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
        {TIPS.map((t) => (
          <View
            key={t.title}
            style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}
          >
            <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={t.icon} size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subtitle" weight="semibold" style={{ fontSize: 16 }}>{t.title}</Text>
              <Text variant="caption">{t.hint}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: SCREEN_PADDING }}>
        <Button title="Got it" onPress={() => router.back()} />
        <View style={{ height: spacing.md }} />
      </SafeAreaView>
    </SafeAreaView>
  );
}
