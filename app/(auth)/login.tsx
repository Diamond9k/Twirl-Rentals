import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { Screen } from "@/components/ui/Screen";
import { colors, fonts, fontSize, spacing } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Couldn't sign in", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View style={{ alignItems: "center", marginBottom: spacing.xxxl }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 44, color: colors.wine }}>
            twirl
          </Text>
          <Text variant="bodyMuted">Rent the look. Lend your closet.</Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <TextField
            label="University email"
            placeholder="you@uark.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text
            variant="link"
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignSelf: "flex-end", fontSize: fontSize.small }}
          >
            Forgot password?
          </Text>

          <Button title="Log in" onPress={onSubmit} loading={loading} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.xxl, gap: 4 }}>
          <Text variant="bodyMuted">New to Twirl?</Text>
          <Text variant="link" weight="semibold" onPress={() => router.push("/(auth)/signup")}>
            Sign up
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
