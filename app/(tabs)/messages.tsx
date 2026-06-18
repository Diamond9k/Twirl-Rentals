import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Wordmark } from "@/components/Wordmark";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/components/ui/Text";
import {
  getConversations,
  otherParty,
  unreadFor,
  type ConversationWithMeta,
} from "@/lib/api/messages";
import { timeAgo } from "@/lib/format";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function MessagesScreen() {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getConversations()
        .then(setConversations)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SCREEN_PADDING, marginTop: spacing.sm }}>
        <Wordmark />
        <Pressable onPress={() => router.push("/new-message")} hitSlop={10}>
          <Ionicons name="create-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <Text variant="display" style={{ paddingHorizontal: SCREEN_PADDING, marginTop: spacing.xs, marginBottom: spacing.md }}>
        Messages
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          message="Message a lender from any listing to start a conversation."
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          {conversations.map((c) => {
            if (!userId) return null;
            const party = otherParty(c, userId);
            const unread = unreadFor(c, userId);
            const thumb = c.item?.images?.[0];
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/conversation/${c.id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingHorizontal: SCREEN_PADDING,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Avatar uri={party?.avatar_url} name={party?.full_name} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="subtitle" weight={unread ? "semibold" : "regular"} style={{ fontSize: 16 }}>
                    {party?.full_name ?? "Conversation"}
                  </Text>
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    color={unread ? colors.text : colors.textMuted}
                  >
                    {c.last_message ?? "Say hello 👋"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  {c.last_message_at ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {unread > 0 ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                      ) : null}
                      <Text variant="caption">{timeAgo(c.last_message_at)}</Text>
                    </View>
                  ) : null}
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={{ width: 44, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }} contentFit="cover" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
