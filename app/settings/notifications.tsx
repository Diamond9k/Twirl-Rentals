import { useState } from "react";
import { Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { updateProfile } from "@/lib/api/profiles";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

const PREFS: { key: string; label: string; hint: string }[] = [
  { key: "messages", label: "Messages", hint: "When someone sends you a message" },
  { key: "rental_updates", label: "Rental updates", hint: "Requests, approvals, returns, and payouts" },
  { key: "reminders", label: "Reminders", hint: "Pickup and return reminders" },
  { key: "marketing", label: "News & tips", hint: "Occasional updates from Twirl" },
];

export default function NotificationsScreen() {
  const { profile, userId, refreshProfile } = useAuth();
  const initial = (profile?.notification_prefs ?? {}) as Record<string, boolean>;
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    messages: initial.messages ?? true,
    rental_updates: initial.rental_updates ?? true,
    reminders: initial.reminders ?? true,
    marketing: initial.marketing ?? false,
  });

  const toggle = async (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (userId) {
      try {
        await updateProfile(userId, { notification_prefs: next });
        await refreshProfile();
      } catch {
        /* keep optimistic value */
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Notifications" back />
      <View style={{ paddingHorizontal: SCREEN_PADDING, marginTop: spacing.md }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
          {PREFS.map((p, i) => (
            <View
              key={p.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.lg,
                gap: spacing.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="body">{p.label}</Text>
                <Text variant="caption">{p.hint}</Text>
              </View>
              <Switch
                value={prefs[p.key]}
                onValueChange={(v) => toggle(p.key, v)}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
