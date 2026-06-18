import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ItemCard } from "@/components/ItemCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Stars } from "@/components/ui/Stars";
import { Text } from "@/components/ui/Text";
import { getItemsByOwner } from "@/lib/api/items";
import { getOrCreateConversation } from "@/lib/api/messages";
import { getProfile } from "@/lib/api/profiles";
import { blockUser, getSavedItemIds, report, setSaved } from "@/lib/api/social";
import { REPORT_REASONS } from "@/lib/constants";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { Item, Profile, ReportReason } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(id), getItemsByOwner(id, ["active"])])
      .then(([p, it]) => {
        setProfile(p);
        setItems(it);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
    if (userId) getSavedItemIds(userId).then(setSavedIds).catch(() => {});
  }, [id, userId]);

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

  const message = async () => {
    if (!userId) return;
    try {
      const convId = await getOrCreateConversation(userId, id);
      router.push(`/conversation/${convId}`);
    } catch (e) {
      Alert.alert("Couldn't open chat", (e as Error).message);
    }
  };

  const doReport = async (reason: ReportReason) => {
    if (!userId) return;
    try {
      await report({ reporter_id: userId, user_id: id, reason });
      setShowReport(false);
      Alert.alert("Reported", "Thanks — our team will review this.");
    } catch (e) {
      Alert.alert("Couldn't report", (e as Error).message);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text variant="bodyMuted" center style={{ marginTop: 80 }}>
          Profile unavailable.
        </Text>
      </SafeAreaView>
    );
  }

  const isMe = userId === id;
  const firstName = profile.full_name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        {!isMe ? (
          <Pressable onPress={() => setShowActions(true)} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Avatar uri={profile.avatar_url} name={profile.full_name} size={96} />
          <Text variant="display">{profile.full_name}</Text>
          <Text variant="bodyMuted">
            {[profile.sorority, profile.school].filter(Boolean).join(" · ")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {profile.rating > 0 ? <Stars rating={profile.rating} size={15} showValue /> : null}
            <Text variant="caption">· {profile.total_rentals} rentals</Text>
          </View>
        </View>

        {!isMe ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button title="Message" onPress={message} />
          </View>
        ) : null}

        <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.md }}>
          {firstName ? `${firstName}'s closet` : "Closet"}
        </Text>

        {items.length === 0 ? (
          <Text variant="bodyMuted" center style={{ marginTop: spacing.lg }}>
            No active listings right now.
          </Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {items.map((item) => (
              <View key={item.id} style={{ width: "47.5%" }}>
                <ItemCard
                  item={item}
                  footer="save"
                  saved={savedIds.has(item.id)}
                  onToggleSave={() => toggleSave(item.id)}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={showActions} onClose={() => setShowActions(false)}>
        <Pressable
          onPress={() => { setShowActions(false); setShowReport(true); }}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg }}
        >
          <Ionicons name="flag-outline" size={22} color={colors.danger} />
          <Text variant="subtitle" style={{ fontSize: 16 }} color={colors.danger}>Report {firstName}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            if (!userId) return;
            setShowActions(false);
            try {
              await blockUser(userId, id);
              Alert.alert("Blocked", `${firstName} can no longer message you.`);
            } catch (e) {
              Alert.alert("Couldn't block", (e as Error).message);
            }
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <Ionicons name="ban-outline" size={22} color={colors.danger} />
          <Text variant="subtitle" style={{ fontSize: 16 }} color={colors.danger}>Block {firstName}</Text>
        </Pressable>
      </Sheet>

      <Sheet visible={showReport} onClose={() => setShowReport(false)} title="Report">
        <Text variant="bodyMuted" center style={{ marginTop: -8, marginBottom: spacing.lg }}>
          Help us keep Twirl safe.
        </Text>
        {REPORT_REASONS.map((r, i) => (
          <Pressable
            key={r.value}
            onPress={() => doReport(r.value)}
            style={{ paddingVertical: spacing.lg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
          >
            <Text variant="subtitle" style={{ fontSize: 16 }}>{r.label}</Text>
          </Pressable>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}
