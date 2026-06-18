import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { spacing } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (fullName.trim().length < 2) {
      Alert.alert("Add your name", "Tell us what to call you.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, fullName);
      if (needsConfirmation) {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link to your university email. Confirm it, then log in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
      } else {
        router.replace("/(auth)/onboarding");
      }
    } catch (e) {
      Alert.alert("Couldn't sign up", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <Header back />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, paddingHorizontal: spacing.xl }}
      >
        <Text variant="display" style={{ marginTop: spacing.sm }}>
          Create your account
        </Text>
        <Text variant="bodyMuted" style={{ marginTop: spacing.xs, marginBottom: spacing.xxl }}>
          Use your .edu email to join your campus closet.
        </Text>

        <View style={{ gap: spacing.lg }}>
          <TextField label="Full name" placeholder="Madison Reed" value={fullName} onChangeText={setFullName} />
          <TextField
            label="University email"
            placeholder="you@uark.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title="Continue" onPress={onSubmit} loading={loading} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.xxl, gap: 4 }}>
          <Text variant="bodyMuted">Already have an account?</Text>
          <Text variant="link" weight="semibold" onPress={() => router.push("/(auth)/login")}>
            Log in
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
