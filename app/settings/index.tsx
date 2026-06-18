import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Sheet";
import { Header } from "@/components/ui/Header";
import { Text } from "@/components/ui/Text";
import { deleteAccount } from "@/lib/api/payments";
import { colors, radius, spacing, SCREEN_PADDING } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

type IconName = keyof typeof Ionicons.glyphMap;

function Row({ icon, label, onPress, last }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 1, marginLeft: spacing.xs }}>
        {title}
      </Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const doDelete = async () => {
    setWorking(true);
    try {
      await deleteAccount();
      await signOut();
    } catch (e) {
      Alert.alert("Couldn't delete account", (e as Error).message);
    } finally {
      setWorking(false);
      setShowDelete(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Settings" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        <Group title="Account">
          <Row icon="person-outline" label="Edit profile" onPress={() => router.push("/settings/profile")} />
          <Row icon="card-outline" label="Payment methods" onPress={() => router.push("/settings/payment-methods")} />
          <Row icon="cash-outline" label="Payout & earnings" onPress={() => router.push("/settings/earnings")} last />
        </Group>

        <Group title="Preferences">
          <Row icon="notifications-outline" label="Notifications" onPress={() => router.push("/settings/notifications")} last />
        </Group>

        <Group title="Support">
          <Row icon="help-buoy-outline" label="Help & support" onPress={() => router.push("/settings/help")} />
          <Row
            icon="shield-outline"
            label="Privacy policy"
            onPress={() => WebBrowser.openBrowserAsync("https://twirl.rentals/privacy")}
          />
          <Row icon="document-text-outline" label="Rental terms" onPress={() => router.push("/settings/legal")} last />
        </Group>

        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <Button title="Sign out" onPress={() => setShowSignOut(true)} />
          <Button title="Delete account" variant="ghost" onPress={() => setShowDelete(true)} />
        </View>
      </ScrollView>

      <Dialog visible={showSignOut} onClose={() => setShowSignOut(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
          <Ionicons name="log-out-outline" size={26} color={colors.primary} />
        </View>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>Sign out?</Text>
        <Text variant="bodyMuted" center style={{ marginBottom: spacing.xl }}>
          You can sign back in anytime with your university email.
        </Text>
        <View style={{ width: "100%", gap: spacing.md }}>
          <Button title="Sign out" onPress={() => { setShowSignOut(false); signOut(); }} />
          <Button title="Cancel" variant="ghost" onPress={() => setShowSignOut(false)} />
        </View>
      </Dialog>

      <Dialog visible={showDelete} onClose={() => setShowDelete(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.danger, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
          <Ionicons name="warning-outline" size={26} color={colors.danger} />
        </View>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>Delete account?</Text>
        <Text variant="bodyMuted" center style={{ marginBottom: spacing.xl }}>
          This permanently deletes your closet, rentals, and messages. This can&apos;t be undone.
        </Text>
        <View style={{ width: "100%", gap: spacing.md }}>
          <Button title="Delete account" onPress={doDelete} loading={working} />
          <Button title="Cancel" variant="ghost" onPress={() => setShowDelete(false)} />
        </View>
      </Dialog>
    </SafeAreaView>
  );
}
