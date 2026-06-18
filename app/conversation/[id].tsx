import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog, Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import {
  getConversation,
  getMessages,
  markConversationRead,
  otherParty,
  sendMessage,
  subscribeToMessages,
  type ConversationWithMeta,
} from "@/lib/api/messages";
import { blockUser, report } from "@/lib/api/social";
import { REPORT_REASONS } from "@/lib/constants";
import { currencyCompact } from "@/lib/format";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { Message, ReportReason } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [conv, setConv] = useState<ConversationWithMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    getConversation(id).then(setConv).catch(() => {});
    getMessages(id).then(setMessages).catch(() => {});
    markConversationRead(id).catch(() => {});
    const unsub = subscribeToMessages(id, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.sender_id !== userId) markConversationRead(id).catch(() => {});
    });
    return unsub;
  }, [id, userId]);

  const party = conv && userId ? otherParty(conv, userId) : null;

  const send = async () => {
    const text = draft.trim();
    if (!text || !userId) return;
    setDraft("");
    setSending(true);
    try {
      const msg = await sendMessage(id, userId, text);
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    } catch (e) {
      Alert.alert("Couldn't send", (e as Error).message);
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const doBlock = async () => {
    if (!userId || !party) return;
    try {
      await blockUser(userId, party.id);
      setShowBlock(false);
      router.back();
    } catch (e) {
      Alert.alert("Couldn't block", (e as Error).message);
    }
  };

  const doReport = async (reason: ReportReason) => {
    if (!userId || !party) return;
    try {
      await report({ reporter_id: userId, user_id: party.id, reason });
      setShowReport(false);
      Alert.alert("Reported", "Thanks — our team will review this.");
    } catch (e) {
      Alert.alert("Couldn't report", (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.sm, gap: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <Avatar uri={party?.avatar_url} name={party?.full_name} size={36} />
        <Text variant="title" style={{ flex: 1, fontSize: 18 }} numberOfLines={1}>
          {party?.full_name ?? "Conversation"}
        </Text>
        <Pressable onPress={() => setShowActions(true)} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Item context card */}
      {conv?.item ? (
        <Pressable
          onPress={() => router.push(`/item/${conv.item!.id}`)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            marginHorizontal: SCREEN_PADDING,
            marginBottom: spacing.sm,
            padding: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Image source={{ uri: conv.item.images?.[0] }} style={{ width: 44, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" style={{ fontSize: 15 }} numberOfLines={1}>
              {conv.item.title}
            </Text>
          </View>
          <Text variant="link" weight="semibold">View</Text>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md, gap: spacing.sm }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: m }) => {
            const mine = m.sender_id === userId;
            return (
              <View
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  backgroundColor: mine ? colors.primary : colors.surface,
                  borderWidth: mine ? 0 : 1,
                  borderColor: colors.border,
                  borderRadius: 18,
                  borderBottomRightRadius: mine ? 4 : 18,
                  borderBottomLeftRadius: mine ? 18 : 4,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  maxWidth: "80%",
                }}
              >
                <Text color={mine ? colors.white : colors.text}>{m.content}</Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Message ${party?.full_name?.split(" ")[0] ?? ""}…`}
            placeholderTextColor={colors.textFaint}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: draft.trim() ? colors.primary : colors.borderStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Actions sheet */}
      <Sheet visible={showActions} onClose={() => setShowActions(false)}>
        <SheetRow icon="bag-outline" label="View listing" disabled={!conv?.item} onPress={() => { setShowActions(false); if (conv?.item) router.push(`/item/${conv.item.id}`); }} />
        <SheetRow icon="ban-outline" label={`Block ${party?.full_name?.split(" ")[0] ?? ""}`} danger onPress={() => { setShowActions(false); setShowBlock(true); }} />
        <SheetRow icon="flag-outline" label="Report" danger onPress={() => { setShowActions(false); setShowReport(true); }} />
        <Button title="Cancel" variant="ghost" onPress={() => setShowActions(false)} style={{ marginTop: spacing.sm }} />
      </Sheet>

      {/* Block dialog */}
      <Dialog visible={showBlock} onClose={() => setShowBlock(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.danger, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
          <Ionicons name="ban" size={26} color={colors.danger} />
        </View>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>
          Block {party?.full_name?.split(" ")[0]}?
        </Text>
        <Text variant="bodyMuted" center style={{ marginBottom: spacing.xl }}>
          They won&apos;t be able to message you or see your listings. You can unblock later in settings.
        </Text>
        <View style={{ width: "100%", gap: spacing.md }}>
          <Button title="Block" onPress={doBlock} />
          <Button title="Cancel" variant="ghost" onPress={() => setShowBlock(false)} />
        </View>
      </Dialog>

      {/* Report sheet */}
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

function SheetRow({ icon, label, onPress, danger, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg, opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.text} />
      <Text variant="subtitle" style={{ fontSize: 16 }} color={danger ? colors.danger : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}
