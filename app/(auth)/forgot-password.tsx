import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { supabase } from "@/lib/supabase";
import { spacing } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      Alert.alert(
        "Check your email",
        "If an account exists, we sent a reset link to that address.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert("Couldn't send link", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <Header back />
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
        <Text variant="display" center>
          Reset your password
        </Text>
        <Text variant="bodyMuted" center style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
          Enter your university email and we&apos;ll send a reset link.
        </Text>

        <View style={{ gap: spacing.lg }}>
          <TextField
            label="University email"
            placeholder="you@uark.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button title="Send reset link" onPress={onSubmit} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}
