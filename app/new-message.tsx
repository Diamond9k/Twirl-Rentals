import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchBar } from "@/components/SearchBar";
import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { getOrCreateConversation } from "@/lib/api/messages";
import { searchProfiles } from "@/lib/api/profiles";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function NewMessageScreen() {
  const { userId } = useAuth();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Pick<Profile, "id" | "full_name" | "avatar_url" | "sorority">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      searchProfiles(query, userId ?? undefined)
        .then(setPeople)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, userId]);

  const start = async (otherId: string) => {
    if (!userId) return;
    try {
      const convId = await getOrCreateConversation(userId, otherId);
      router.replace(`/conversation/${convId}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="New message" back />
      <View style={{ paddingHorizontal: SCREEN_PADDING, marginBottom: spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} autoFocus placeholder="Search people…" />
      </View>

      <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: SCREEN_PADDING, marginBottom: spacing.sm }}>
        {query ? "Results" : "Recent"}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          {people.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => start(p.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md }}
            >
              <Avatar uri={p.avatar_url} name={p.full_name} size={48} />
              <View>
                <Text variant="subtitle" style={{ fontSize: 16 }}>{p.full_name}</Text>
                {p.sorority ? <Text variant="caption">{p.sorority}</Text> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
